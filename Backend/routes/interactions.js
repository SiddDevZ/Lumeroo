import { Hono } from 'hono';
import Video from '../models/Video.js';
import Image from '../models/Image.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { rateLimiter } from 'hono-rate-limiter';

const router = new Hono();

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
});

const JWT_SECRET = process.env.JWT_SECRET;

const verifyTokenAndGetUser = async (token) => {
  if (!token) {
    return { error: 'Token is required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    return { user, userId: user._id };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return { error: 'Invalid or expired token', status: 401 };
  }
};

const getContentModel = (contentType) => {
  switch (contentType.toLowerCase()) {
    case 'video':
      return Video;
    case 'image':
      return Image;
    default:
      return null;
  }
};

router.post('/toggle-like', limiter, async (c) => {
  try {
    const { token, contentId, contentType, action } = await c.req.json();

    if (!['like', 'dislike'].includes(action)) {
      return c.json({
        success: false,
        message: 'Invalid action. Must be "like" or "dislike"'
      }, 400);
    }

    const authResult = await verifyTokenAndGetUser(token);
    if (authResult.error) {
      return c.json({
        success: false,
        message: authResult.error
      }, authResult.status);
    }

    const { userId } = authResult;

    const ContentModel = getContentModel(contentType);
    if (!ContentModel) {
      return c.json({
        success: false,
        message: 'Invalid content type. Must be "video" or "image"'
      }, 400);
    }

    const content = await ContentModel.findById(contentId);
    if (!content) {
      return c.json({
        success: false,
        message: `${contentType} not found`
      }, 404);
    }

    const isLiked = content.likedBy.includes(userId);
    const isDisliked = content.dislikedBy.includes(userId);

    let updateQuery = {};

    if (action === 'like') {
      if (isLiked) {
        updateQuery = { $pull: { likedBy: userId } };
      } else {
        updateQuery = { $addToSet: { likedBy: userId } };
        if (isDisliked) {
          updateQuery.$pull = { dislikedBy: userId };
        }
      }
    } else {
      if (isDisliked) {
        updateQuery = { $pull: { dislikedBy: userId } };
      } else {
        updateQuery = { $addToSet: { dislikedBy: userId } };
        if (isLiked) {
          updateQuery.$pull = { likedBy: userId };
        }
      }
    }

    await ContentModel.findByIdAndUpdate(contentId, updateQuery);

    return c.json({
      success: true,
      message: 'Interaction updated successfully'
    });

  } catch (error) {
    console.error('Error in toggle-like route:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});

router.post('/subscribe', limiter, async (c) => {
  try {
    const { token, targetUserId } = await c.req.json();

    const authResult = await verifyTokenAndGetUser(token);
    if (authResult.error) {
      return c.json({
        success: false,
        message: authResult.error
      }, authResult.status);
    }

    const { userId } = authResult;

    if (userId.toString() === targetUserId) {
      return c.json({
        success: false,
        message: 'Cannot subscribe to yourself'
      }, 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    const currentUser = await User.findById(userId);
    const isAlreadySubscribed = currentUser.subscriptions.includes(targetUserId);

    let action;
    let newSubscriberCount;

    if (isAlreadySubscribed) {
      await User.findByIdAndUpdate(userId, {
        $pull: { subscriptions: targetUserId }
      });
      
      const updatedTargetUser = await User.findByIdAndUpdate(targetUserId, {
        $inc: { subscriberCount: -1 }
      }, { new: true });

      newSubscriberCount = updatedTargetUser.subscriberCount;
      action = 'unsubscribed';
    } else {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { subscriptions: targetUserId }
      });
      
      const updatedTargetUser = await User.findByIdAndUpdate(targetUserId, {
        $inc: { subscriberCount: 1 }
      }, { new: true });

      newSubscriberCount = updatedTargetUser.subscriberCount;
      action = 'subscribed';
    }

    return c.json({
      success: true,
      message: action === 'subscribed' ? 'Successfully subscribed' : 'Successfully unsubscribed',
      action,
      isSubscribed: action === 'subscribed',
      subscriberCount: newSubscriberCount
    });

  } catch (error) {
    console.error('Error in subscribe route:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});

export default router;