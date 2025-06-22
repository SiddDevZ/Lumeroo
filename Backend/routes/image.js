import { Hono } from 'hono'
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
        message: 'Image slug is required' 
      }, 400)
    }

    const image = await Image.findOne({ slug }).populate('uploader', 'username avatar avatarColor subscriberCount')
    
    if (!image) {
      return c.json({ 
        success: false, 
        message: 'Image not found' 
      }, 404)
    }

    await Image.findByIdAndUpdate(image._id, { $inc: { views: 1 } })

    let userInteractionStatus = null;
    let userSubscriptionStatus = null;
    
    if (token) {
      const userId = await verifyTokenAndGetUser(token);
      if (userId) {
        const isLiked = image.likedBy.includes(userId);
        const isDisliked = image.dislikedBy.includes(userId);
        
        userInteractionStatus = {
          isLiked,
          isDisliked
        };

        const currentUser = await User.findById(userId);
        if (currentUser && image.uploader._id) {
          const isSubscribed = currentUser.subscriptions.includes(image.uploader._id);
          userSubscriptionStatus = {
            isSubscribed,
            canSubscribe: userId.toString() !== image.uploader._id.toString()
          };
        }
      }
    }

    const imageResponse = {
      _id: image._id,
      title: image.title,
      description: image.description,
      slug: image.slug,
      imageUrls: image.imageUrls,
      thumbnailIndex: image.thumbnailIndex,
      views: image.views + 1,
      likeCount: image.likedBy.length,
      dislikeCount: image.dislikedBy.length,
      tags: image.tags || [],
      uploadDate: image.uploadDate,
      createdAt: image.createdAt,
      uploader: {
        _id: image.uploader._id,
        username: image.uploader.username,
        avatar: image.uploader.avatar,
        avatarColor: image.uploader.avatarColor,
        subscriberCount: image.uploader.subscriberCount || 0
      },
      ...(userInteractionStatus && { userInteractionStatus }),
      ...(userSubscriptionStatus && { userSubscriptionStatus })
    }
    
    return c.json({
      success: true,
      image: imageResponse
    }, 200)
    
  } catch (error) {
    console.error('Image retrieval error:', error)
    return c.json({ success: false, message: 'Server error', error: error.message }, 500)
  }
})

export default router