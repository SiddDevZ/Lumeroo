import { Hono } from 'hono'
import Video from '../models/Video.js'
import Image from '../models/Image.js'
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

const verifyTokenAndGetUser = async (token) => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    return user ? user._id : null;
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
        message: 'Content slug is required' 
      }, 400)
    }

    // Try to find video first
    let content = await Video.findOne({ slug }).populate('uploader', 'username avatar avatarColor subscriberCount')
    let contentType = 'video'

    // If no video found, try to find image
    if (!content) {
      content = await Image.findOne({ slug }).populate('uploader', 'username avatar avatarColor subscriberCount')
      contentType = 'image'
    }

    // If neither found, return 404
    if (!content) {
      return c.json({ 
        success: false, 
        message: 'Content not found' 
      }, 404)
    }

    // Increment view count
    if (contentType === 'video') {
      await Video.findByIdAndUpdate(content._id, { $inc: { views: 1 } })
    } else {
      await Image.findByIdAndUpdate(content._id, { $inc: { views: 1 } })
    }

    let userInteractionStatus = null;
    let userSubscriptionStatus = null;
    
    if (token) {
      const userId = await verifyTokenAndGetUser(token);
      if (userId) {
        const isLiked = content.likedBy.includes(userId);
        const isDisliked = content.dislikedBy.includes(userId);
        
        userInteractionStatus = {
          isLiked,
          isDisliked
        };

        const currentUser = await User.findById(userId);
        if (currentUser && content.uploader._id) {
          const isSubscribed = currentUser.subscriptions.includes(content.uploader._id);
          userSubscriptionStatus = {
            isSubscribed,
            canSubscribe: userId.toString() !== content.uploader._id.toString()
          };
        }
      }
    }

    // Build response based on content type
    let contentResponse;
    
    if (contentType === 'video') {
      contentResponse = {
        _id: content._id,
        title: content.title,
        description: content.description,
        slug: content.slug,
        videoUrl: content.videoUrl,
        thumbnail: content.thumbnail,
        duration: content.duration,
        views: content.views + 1,
        likeCount: content.likedBy.length,
        dislikeCount: content.dislikedBy.length,
        tags: content.tags || [],
        cloudflareStreamId: content.cloudflareStreamId,
        createdAt: content.createdAt,
        type: 'video',
        uploader: {
          _id: content.uploader._id,
          username: content.uploader.username,
          avatar: content.uploader.avatar,
          avatarColor: content.uploader.avatarColor,
          subscriberCount: content.uploader.subscriberCount || 0
        },
        ...(userInteractionStatus && { userInteractionStatus }),
        ...(userSubscriptionStatus && { userSubscriptionStatus })
      }
    } else {
      contentResponse = {
        _id: content._id,
        title: content.title,
        description: content.description,
        slug: content.slug,
        imageUrls: content.imageUrls,
        thumbnailIndex: content.thumbnailIndex,
        views: content.views + 1,
        likeCount: content.likedBy?.length || 0,
        dislikeCount: content.dislikedBy?.length || 0,
        tags: content.tags || [],
        uploadDate: content.uploadDate,
        createdAt: content.createdAt,
        type: 'image',
        uploader: {
          _id: content.uploader._id,
          username: content.uploader.username,
          avatar: content.uploader.avatar,
          avatarColor: content.uploader.avatarColor,
          subscriberCount: content.uploader.subscriberCount || 0
        },
        ...(userInteractionStatus && { userInteractionStatus }),
        ...(userSubscriptionStatus && { userSubscriptionStatus })
      }
    }
    
    return c.json({
      success: true,
      content: contentResponse,
      type: contentType
    }, 200)
    
  } catch (error) {
    console.error('Content retrieval error:', error)
    return c.json({ success: false, message: 'Server error', error: error.message }, 500)
  }
})

export default router