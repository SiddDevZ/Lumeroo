import { Hono } from 'hono'
import Video from '../models/Video.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'
import mongoose from 'mongoose'

const router = new Hono()

const JWT_SECRET = process.env.JWT_SECRET

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const VIDEO_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  slug: 1,
  thumbnail: 1,
  duration: 1,
  views: 1,
  likeCount: { $size: { $ifNull: ['$likedBy', []] } },
  dislikeCount: { $size: { $ifNull: ['$dislikedBy', []] } },
  tags: 1,
  createdAt: 1,
  hotness: 1,
  uploader: 1
}

const USER_LOOKUP_STAGE = {
  $lookup: {
    from: 'users',
    localField: 'uploader',
    foreignField: '_id',
    as: 'uploader',
    pipeline: [{ $project: { username: 1, avatar: 1, avatarColor: 1, subscriberCount: 1 } }]
  }
}

const verifyTokenAndGetUser = async (token) => {
  if (!token) {
    return { user: null, userId: null };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return { user: null, userId: null };
    }

    return { user, userId: user._id };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return { user: null, userId: null };
  }
};

const createPaginationResponse = (totalCount, pageNum, limitNum) => {
  const totalPages = Math.ceil(totalCount / limitNum);
  return {
    currentPage: pageNum,
    totalPages,
    totalVideos: totalCount,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    limit: limitNum
  };
};

router.get('/', limiter, async (c) => {
  try {
    const { limit = 20, page = 1, sort = 'hot', token, excludeIds: excludeIdsQuery } = c.req.query();
    
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const parsedExcludeIds = excludeIdsQuery 
      ? excludeIdsQuery.split(',')
          .filter(id => id.trim() && !id.includes('_copy_'))
          .map(id => {
            const cleanId = id.split('_copy_')[0];
            try {
              return new mongoose.Types.ObjectId(cleanId);
            } catch (error) {
              console.warn(`Invalid ObjectId in excludeIds: ${cleanId}`);
              return null;
            }
          })
          .filter(Boolean)
      : [];
      
    const baseCriteria = { isProcessing: false };

    if (sort === 'random') {
      let randomMatchCriteria = { ...baseCriteria };
      if (parsedExcludeIds.length > 0) {
        randomMatchCriteria._id = { $nin: parsedExcludeIds };
      }
      const randomPipeline = [
        { $match: randomMatchCriteria },
        { $sample: { size: 1 } },
        USER_LOOKUP_STAGE,
        { $unwind: '$uploader' },
        { $project: VIDEO_PROJECTION }
      ];

      const randomVideos = await Video.aggregate(randomPipeline);

      if (!randomVideos || randomVideos.length === 0) {
        return c.json({
          success: false,
          message: 'No videos available for random selection'
        }, 404);
      }

      return c.json({
        success: true,
        redirect: true,
        videoSlug: randomVideos[0].slug,
        message: 'Random video selected'
      }, 200);
    }

    if (sort === 'subscriptions') {
      const { user } = await verifyTokenAndGetUser(token);
      
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required to view subscriptions',
          requiresAuth: true
        }, 401);
      }

      if (!user.subscriptions || user.subscriptions.length === 0) {
        return c.json({
          success: true,
          videos: [],
          message: "You haven't subscribed to anyone yet. Subscribe to creators to see their content here!",
          isEmpty: true,
          pagination: createPaginationResponse(0, pageNum, limitNum)
        }, 200);
      }

      let subscriptionsQueryCriteria = { ...baseCriteria, uploader: { $in: user.subscriptions } };
      let subscriptionsCountCriteria = { ...baseCriteria, uploader: { $in: user.subscriptions } };
      
      const subscriptionPipeline = [
        { $match: subscriptionsQueryCriteria },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        USER_LOOKUP_STAGE,
        { $unwind: '$uploader' },
        { $project: VIDEO_PROJECTION }
      ];
      
      const [videos, totalCount] = await Promise.all([
        Video.aggregate(subscriptionPipeline),
        Video.countDocuments(subscriptionsCountCriteria)
      ]);

      if (!videos || videos.length === 0) {
        return c.json({
          success: true,
          videos: [],
          message: "No recent videos from your subscriptions. Your subscribed creators haven't posted anything yet.",
          isEmpty: true,
          pagination: createPaginationResponse(totalCount, pageNum, limitNum)
        }, 200);
      }

      return c.json({
        success: true,
        videos: videos,
        sort: sort,
        pagination: createPaginationResponse(totalCount, pageNum, limitNum)
      }, 200);
    }

    if (sort === 'hot') {
      let hotMatchCriteria = { ...baseCriteria };
      if (parsedExcludeIds.length > 0) {
        hotMatchCriteria._id = { $nin: parsedExcludeIds };
      }
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const hotPoolSize = limitNum * 5;
      const recentPoolSize = limitNum * 3;
      
      const hotPipeline = [
        { $match: hotMatchCriteria },
        { $facet: {
          hot: [
            { $sort: { hotness: -1 } },
            { $limit: hotPoolSize },
            { $sample: { size: Math.ceil(limitNum * 0.8) } }
          ],
          recent: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $sort: { createdAt: -1 } },
            { $limit: recentPoolSize },
            { $sample: { size: Math.ceil(limitNum * 0.6) } }
          ]
        }},
        { $project: {
          hot: 1, 
          hotIds: { $map: { input: '$hot', as: 'video', in: '$$video._id' } },
          recent: 1
        }},
        { $project: {
          hot: 1,
          recentFiltered: {
            $filter: {
              input: '$recent',
              as: 'video',
              cond: { $not: { $in: ['$$video._id', '$hotIds'] } }
            }
          }
        }},
        { $project: {
          combined: { 
            $concatArrays: [
              '$hot', 
              { $slice: ['$recentFiltered', Math.ceil(limitNum * 0.2)] }
            ]
          }
        }},
        { $unwind: '$combined' },
        { $replaceRoot: { newRoot: '$combined' } },
        { $addFields: { randomSort: { $rand: {} } } },
        { $sort: { randomSort: 1 } },
        USER_LOOKUP_STAGE,
        { $unwind: '$uploader' },
        { $project: VIDEO_PROJECTION },
        { $limit: limitNum }
      ];

      let hotResults = await Video.aggregate(hotPipeline);

      if (hotResults.length < limitNum) {
        const currentVideoIds = hotResults.map(v => v._id);
        const additionalExcludeIds = [...parsedExcludeIds, ...currentVideoIds];
        
        const additionalCriteria = { 
          ...baseCriteria,
          _id: { $nin: additionalExcludeIds }
        };
        
        const neededCount = limitNum - hotResults.length;
        
        const fallbackPipeline = [
          { $match: additionalCriteria },
          { $sort: { hotness: -1, views: -1 } },
          { $limit: neededCount },
          USER_LOOKUP_STAGE,
          { $unwind: '$uploader' },
          { $project: VIDEO_PROJECTION }
        ];
        
        const additionalResults = await Video.aggregate(fallbackPipeline);
        hotResults = [...hotResults, ...additionalResults];
      }

      const totalCount = await Video.countDocuments(hotMatchCriteria);

      return c.json({
        success: true,
        videos: hotResults,
        sort: sort,
        pagination: createPaginationResponse(totalCount, pageNum, limitNum)
      }, 200);
    }

    let standardQueryCriteria = { ...baseCriteria };
    let standardCountCriteria = { ...baseCriteria };

    let sortOrder = {};
    switch (sort) {
      case 'top':
        sortOrder = { views: -1 };
        break;
      case 'recent':
        sortOrder = { createdAt: -1 };
        break;
      default: // Handles 'liked' (mapped to 'top' by frontend) or other unspecific sorts
        sortOrder = { views: -1 }; 
    }

    const standardPipeline = [
      { $match: standardQueryCriteria },
      { $sort: sortOrder },
      { $skip: skip },
      { $limit: limitNum },
      USER_LOOKUP_STAGE,
      { $unwind: '$uploader' },
      { $project: VIDEO_PROJECTION }
    ];
    
    const [videos, totalCount] = await Promise.all([
      Video.aggregate(standardPipeline),
      Video.countDocuments(standardCountCriteria)
    ]);

    if (!videos || videos.length === 0) {
      return c.json({
        success: true,
        videos: [],
        message: 'No videos found',
        isEmpty: true,
        pagination: createPaginationResponse(0, pageNum, limitNum)
      }, 200);
    }

    return c.json({
      success: true,
      videos,
      sort,
      pagination: createPaginationResponse(totalCount, pageNum, limitNum)
    }, 200);

  } catch (error) {
    console.error('Discover videos error:', error);
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500);
  }
});

export default router