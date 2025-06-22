import { Hono } from 'hono'
import Video from '../models/Video.js'
import { rateLimiter } from 'hono-rate-limiter'
import mongoose from 'mongoose'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 150,
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

router.get('/', limiter, async (c) => {
  try {
    const { limit = 12, excludeId, excludeIds } = c.req.query()
    
    const limitNum = Math.min(parseInt(limit) || 12, 20);

    let excludedObjectIds = [];
    if (excludeIds) {
      const ids = excludeIds.split(',').filter(id => id.trim());
      excludedObjectIds = ids.map(id => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (error) {
          console.warn(`Invalid ObjectId: ${id}`);
          return null;
        }
      }).filter(Boolean);
    }
    if (excludeId) {
      try {
        excludedObjectIds.push(new mongoose.Types.ObjectId(excludeId));
      } catch (error) {
        console.warn(`Invalid excludeId: ${excludeId}`);
      }
    }

    let matchCriteria = { isProcessing: false };
    if (excludedObjectIds.length > 0) {
      matchCriteria._id = { $nin: excludedObjectIds };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const hotPoolSize = limitNum * 5;
    const recentPoolSize = limitNum * 3;
    
    const hotPipeline = [
      { $match: matchCriteria },
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

    const hotResults = await Video.aggregate(hotPipeline);

    return c.json({
      success: true,
      videos: hotResults,
      total: hotResults.length,
      algorithm: 'hotness-based'
    }, 200);

  } catch (error) {
    console.error('Recommended videos error:', error);
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500);
  }
});

export default router