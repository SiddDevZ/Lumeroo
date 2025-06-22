import { Hono } from 'hono'
import Video from '../models/Video.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const JWT_SECRET = process.env.JWT_SECRET;

const verifyTokenAndGetUserId = async (token) => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email }).select('_id subscriptions').lean();
    return user || null;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

router.get('/:slug', limiter, async (c) => {
  try {
    const { slug } = c.req.param()
    const { token } = c.req.query()

    if (!slug) {
      return c.json({ 
        success: false, 
        message: 'Video slug is required' 
      }, 400)
    }

    const pipeline = [
      { $match: { slug } },
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
          videoUrl: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          likeCount: { $size: { $ifNull: ['$likedBy', []] } },
          dislikeCount: { $size: { $ifNull: ['$dislikedBy', []] } },
          tags: { $ifNull: ['$tags', []] },
          cloudflareStreamId: 1,
          createdAt: 1,
          uploader: 1,
          likedBy: 1,
          dislikedBy: 1
        }
      }
    ];

    const [video] = await Video.aggregate(pipeline);
    
    if (!video) {
      return c.json({ 
        success: false, 
        message: 'Video not found' 
      }, 404)
    }

    Video.findByIdAndUpdate(video._id, { $inc: { views: 1 } }).exec();

    let userInteractionStatus = null;
    let userSubscriptionStatus = null;
    
    if (token) {
      const currentUser = await verifyTokenAndGetUserId(token);
      if (currentUser) {
        const isLiked = video.likedBy.some(id => id.equals(currentUser._id));
        const isDisliked = video.dislikedBy.some(id => id.equals(currentUser._id));
        
        userInteractionStatus = {
          isLiked,
          isDisliked
        };

        const isSubscribed = currentUser.subscriptions.some(id => id.equals(video.uploader._id));
        userSubscriptionStatus = {
          isSubscribed,
          canSubscribe: !currentUser._id.equals(video.uploader._id)
        };
      }
    }

    const { likedBy, dislikedBy, ...videoResponse } = video;

    const response = {
      _id: videoResponse._id,
      title: videoResponse.title,
      description: videoResponse.description,
      slug: videoResponse.slug,
      videoUrl: videoResponse.videoUrl,
      thumbnail: videoResponse.thumbnail,
      duration: videoResponse.duration,
      views: videoResponse.views + 1,
      likeCount: videoResponse.likeCount,
      dislikeCount: videoResponse.dislikeCount,
      tags: videoResponse.tags,
      createdAt: videoResponse.createdAt,
      uploader: videoResponse.uploader,
      ...(userInteractionStatus && { userInteractionStatus }),
      ...(userSubscriptionStatus && { userSubscriptionStatus })
    }
    
    return c.json({
      success: true,
      video: response
    }, 200)
    
  } catch (error) {
    console.error('Video retrieval error:', error)
    return c.json({ success: false, message: 'Server error' }, 500)
  }
})

export default router