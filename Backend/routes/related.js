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

router.get('/:contentId', limiter, async (c) => {
  try {
    const { contentId } = c.req.param()
    const { limit = 12, excludeIds } = c.req.query()
    
    const limitNum = Math.min(parseInt(limit) || 12, 20);
    const excludedIds = excludeIds 
      ? excludeIds.split(',').filter(id => id.trim()).map(id => new mongoose.Types.ObjectId(id))
      : [];

    const contentObjectId = new mongoose.Types.ObjectId(contentId);

    const currentVideo = await Video.findById(contentObjectId)
      .select('_id title uploader tags')
      .populate('uploader', '_id username')
      .lean();

    if (!currentVideo) {
      return c.json({
        success: false,
        message: 'Video not found'
      }, 404);
    }

    const relatedPipeline = [
      {
        $match: {
          isProcessing: false,
          _id: { 
            $nin: [contentObjectId, ...excludedIds]
          }
        }
      },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              { $cond: [{ $eq: ['$uploader', currentVideo.uploader._id] }, 50, 0] },
              { 
                $multiply: [
                  { $size: { $setIntersection: ['$tags', currentVideo.tags || []] } },
                  20
                ]
              },
              { $multiply: [{ $ifNull: ['$hotness', 0] }, 5] },
              { $multiply: [{ $divide: [{ $ifNull: ['$views', 0] }, 1000] }, 1] }
            ]
          }
        }
      },
      { $sort: { relevanceScore: -1, createdAt: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'users',
          localField: 'uploader',
          foreignField: '_id',
          as: 'uploader',
          pipeline: [
            { 
              $project: { 
                _id: 1, 
                username: 1, 
                avatar: 1, 
                avatarColor: 1, 
                subscriberCount: 1 
              } 
            }
          ]
        }
      },
      { $unwind: '$uploader' },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          slug: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          likeCount: { $size: { $ifNull: ['$likedBy', []] } },
          dislikeCount: { $size: { $ifNull: ['$dislikedBy', []] } },
          tags: { $ifNull: ['$tags', []] },
          createdAt: 1,
          hotness: { $ifNull: ['$hotness', 0] },
          uploader: 1
        }
      }
    ];

    const relatedVideos = await Video.aggregate(relatedPipeline);

    return c.json({
      success: true,
      videos: relatedVideos,
      total: relatedVideos.length,
      currentVideo: {
        id: currentVideo._id,
        title: currentVideo.title,
        uploader: currentVideo.uploader.username
      }
    }, 200);

  } catch (error) {
    console.error('Related videos error:', error);
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500);
  }
});

export default router