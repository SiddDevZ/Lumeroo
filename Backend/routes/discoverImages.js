import { Hono } from 'hono'
import Image from '../models/Image.js'
import { rateLimiter } from 'hono-rate-limiter'
import mongoose from 'mongoose'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const IMAGE_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  slug: 1,
  imageUrls: 1,
  thumbnailIndex: 1,
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

const createPaginationResponse = (totalCount, pageNum, limitNum) => {
  const totalPages = Math.ceil(totalCount / limitNum);
  return {
    currentPage: pageNum,
    totalPages,
    totalImages: totalCount,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    limit: limitNum
  };
};

router.get('/', limiter, async (c) => {
  try {
    const { limit = 20, page = 1, excludeIds } = c.req.query()
    
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const excludedIds = excludeIds 
      ? excludeIds.split(',')
          .filter(id => id.trim())
          .filter(id => !id.includes('_copy_'))
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
      
    let matchCriteria = {};
    if (excludedIds.length > 0) {
      matchCriteria._id = { $nin: excludedIds };
    }

    try {
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
          hotIds: { $map: { input: '$hot', as: 'image', in: '$$image._id' } },
          recent: 1
        }},
        { $project: {
          hot: 1,
          recentFiltered: {
            $filter: {
              input: '$recent',
              as: 'image',
              cond: { $not: { $in: ['$$image._id', '$hotIds'] } }
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
        { $project: IMAGE_PROJECTION },
        { $limit: limitNum }
      ];

      const [hotResults, totalCount] = await Promise.all([
        Image.aggregate(hotPipeline),
        Image.countDocuments(matchCriteria)
      ]);

      return c.json({
        success: true,
        images: hotResults,
        pagination: createPaginationResponse(totalCount, pageNum, limitNum)
      }, 200);

    } catch (error) {
      console.error('Hot images with random recent error:', error);
      const images = await Image.find(matchCriteria)
        .populate('uploader', 'username avatar avatarColor subscriberCount')
        .sort({ hotness: -1 })
        .limit(limitNum)
        .skip(skip)
        .lean();

      if (!images || images.length === 0) {
        return c.json({
          success: true,
          images: [],
          message: 'No images found',
          isEmpty: true,
          pagination: createPaginationResponse(0, pageNum, limitNum)
        }, 200);
      }

      const formattedImages = images.map(image => ({
        _id: image._id,
        title: image.title,
        description: image.description,
        slug: image.slug,
        imageUrls: image.imageUrls,
        thumbnailIndex: image.thumbnailIndex,
        views: image.views,
        likeCount: image.likedBy?.length || 0,
        dislikeCount: image.dislikedBy?.length || 0,
        tags: image.tags || [],
        createdAt: image.createdAt,
        hotness: image.hotness,
        uploader: {
          _id: image.uploader._id,
          username: image.uploader.username,
          avatar: image.uploader.avatar,
          avatarColor: image.uploader.avatarColor,
          subscriberCount: image.uploader.subscriberCount || 0
        }
      }));

      const totalImages = await Image.countDocuments(matchCriteria);

      return c.json({
        success: true,
        images: formattedImages,
        pagination: createPaginationResponse(totalImages, pageNum, limitNum)
      }, 200);
    }

  } catch (error) {
    console.error('Discover images error:', error);
    return c.json({
      success: false,
      message: 'Server error',
      error: error.message
    }, 500);
  }
});

export default router