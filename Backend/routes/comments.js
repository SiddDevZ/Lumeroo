import { Hono } from 'hono'
import Comment from '../models/Comment.js'
import Video from '../models/Video.js'
import Image from '../models/Image.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const JWT_SECRET = process.env.JWT_SECRET

const commentLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const postLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const verifyTokenAndGetUser = async (token) => {
  if (!token) {
    return { user: null, error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      return { user: null, error: 'User not found' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return { user: null, error: 'Invalid or expired token' };
  }
};

const validateContent = (content) => {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  const trimmedContent = content.trim();
  return trimmedContent.length > 0 && trimmedContent.length <= 1000; // Max 1000 characters
};

const sanitizeContent = (content) => {
  return content
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const verifyContentExists = async (contentId, contentType) => {
  try {
    let content;
    if (contentType === 'video') {
      content = await Video.findById(contentId);
    } else if (contentType === 'image') {
      content = await Image.findById(contentId);
    }
    return content !== null;
  } catch (error) {
    return false;
  }
};

// POST /api/comments/action - Unified action endpoint for like/dislike/delete
router.post('/action', commentLimiter, async (c) => {
  try {
    const { commentId, replyId, action, token } = await c.req.json();

    const { user, error } = await verifyTokenAndGetUser(token);
    if (!user) {
      return c.json({
        success: false,
        message: error || 'Authentication required'
      }, 401);
    }

    if (!['like', 'dislike', 'delete'].includes(action)) {
      return c.json({
        success: false,
        message: 'Invalid action'
      }, 400);
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return c.json({
        success: false,
        message: 'Comment not found'
      }, 404);
    }

    const userId = user._id;

    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return c.json({
          success: false,
          message: 'Reply not found'
        }, 404);
      }

      if (action === 'delete') {
        if (reply.user.toString() !== userId.toString() && !user.isAdmin) {
          return c.json({
            success: false,
            message: 'You can only delete your own replies'
          }, 403);
        }

        comment.replies.pull(replyId);
        await comment.save();

        return c.json({
          success: true,
          message: 'Reply deleted successfully'
        }, 200);
      }

      const isLiked = reply.likedBy.includes(userId);
      const isDisliked = reply.dislikedBy.includes(userId);

      if (action === 'like') {
        if (isLiked) {
          reply.likedBy.pull(userId);
        } else {
          reply.likedBy.push(userId);
          if (isDisliked) {
            reply.dislikedBy.pull(userId);
          }
        }
      } else if (action === 'dislike') {
        if (isDisliked) {
          reply.dislikedBy.pull(userId);
        } else {
          reply.dislikedBy.push(userId);
          if (isLiked) {
            reply.likedBy.pull(userId);
          }
        }
      }

      await comment.save();

      return c.json({
        success: true,
        message: `Reply ${action}${action === 'like' ? (isLiked ? ' removed' : 'd') : action === 'dislike' ? (isDisliked ? ' removed' : 'd') : 'd'}`,
        likeCount: reply.likedBy.length,
        dislikeCount: reply.dislikedBy.length,
        isLiked: action === 'like' ? !isLiked : false,
        isDisliked: action === 'dislike' ? !isDisliked : false
      }, 200);
    }

    if (action === 'delete') {
      if (comment.user.toString() !== userId.toString() && !user.isAdmin) {
        return c.json({
          success: false,
          message: 'You can only delete your own comments'
        }, 403);
      }

      await Comment.findByIdAndDelete(commentId);

      return c.json({
        success: true,
        message: 'Comment deleted successfully'
      }, 200);
    }

    const isLiked = comment.likedBy.includes(userId);
    const isDisliked = comment.dislikedBy.includes(userId);

    if (action === 'like') {
      if (isLiked) {
        comment.likedBy.pull(userId);
      } else {
        comment.likedBy.push(userId);
        if (isDisliked) {
          comment.dislikedBy.pull(userId);
        }
      }
    } else if (action === 'dislike') {
      if (isDisliked) {
        comment.dislikedBy.pull(userId);
      } else {
        comment.dislikedBy.push(userId);
        if (isLiked) {
          comment.likedBy.pull(userId);
        }
      }
    }

    await comment.save();

    return c.json({
      success: true,
      message: `Comment ${action}${action === 'like' ? (isLiked ? ' removed' : 'd') : action === 'dislike' ? (isDisliked ? ' removed' : 'd') : 'd'}`,
      likeCount: comment.likedBy.length,
      dislikeCount: comment.dislikedBy.length,
      isLiked: action === 'like' ? !isLiked : false,
      isDisliked: action === 'dislike' ? !isDisliked : false
    }, 200);

  } catch (error) {
    console.error('Comment action error:', error);
    return c.json({
      success: false,
      message: 'Server error',
      error: error.message
    }, 500);
  }
});

// POST /api/comments/:commentId/reply - Reply to a comment
router.post('/:commentId/reply', postLimiter, async (c) => {
  try {
    const { commentId } = c.req.param();
    const { content, token } = await c.req.json();

    const { user, error } = await verifyTokenAndGetUser(token);
    if (!user) {
      return c.json({
        success: false,
        message: error || 'Authentication required'
      }, 401);
    }
    if (!validateContent(content)) {
      return c.json({
        success: false,
        message: 'Reply content must be between 1 and 1000 characters'
      }, 400);
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return c.json({
        success: false,
        message: 'Comment not found'
      }, 404);
    }

    const sanitizedContent = sanitizeContent(content);

    const newReply = {
      user: user._id,
      content: sanitizedContent,
      likedBy: [],
      dislikedBy: [],
      createdAt: new Date()
    };

    comment.replies.push(newReply);
    await comment.save();

    const addedReply = comment.replies[comment.replies.length - 1];

    const formattedReply = {
      _id: addedReply._id,
      user: addedReply.user,
      username: user.username,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      content: addedReply.content,
      likeCount: 0,
      dislikeCount: 0,
      createdAt: addedReply.createdAt
    };

    return c.json({
      success: true,
      message: 'Reply posted successfully',
      reply: formattedReply,
      commentId: commentId
    }, 201);

  } catch (error) {
    console.error('Post reply error:', error);
    return c.json({
      success: false,
      message: 'Server error',
      error: error.message
    }, 500);
  }
});

// Get comments for content
router.get('/:contentType/:contentId', commentLimiter, async (c) => {
  try {
    const { contentType, contentId } = c.req.param();
    const { page = 1, limit = 20, sort = 'recent', token } = c.req.query();

    if (!['video', 'image'].includes(contentType)) {
      return c.json({
        success: false,
        message: 'Invalid content type'
      }, 400);
    }

    const contentExists = await verifyContentExists(contentId, contentType);
    if (!contentExists) {
      return c.json({
        success: false,
        message: 'Content not found'
      }, 404);
    }

    // Verify user if token is provided (optional for viewing comments)
    let currentUser = null;
    if (token) {
      const { user } = await verifyTokenAndGetUser(token);
      currentUser = user;
    }

    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    let sortCriteria = {};
    switch (sort) {
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'popular':
        sortCriteria = { 'likedBy': -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    const comments = await Comment.find({
      contentId,
      contentType
    })
    .sort(sortCriteria)
    .limit(limitNum)
    .skip(skip)
    .populate('user', 'username avatar avatarColor')
    .populate('replies.user', 'username avatar avatarColor')
    .lean();

    const formattedComments = comments.map(comment => ({
      _id: comment._id,
      user: comment.user._id,
      username: comment.user.username,
      avatar: comment.user.avatar,
      avatarColor: comment.user.avatarColor,
      content: comment.content,
      likeCount: comment.likedBy?.length || 0,
      dislikeCount: comment.dislikedBy?.length || 0,
      replyCount: comment.replies?.length || 0,
      createdAt: comment.createdAt,
      // User-specific like/dislike status (only if user is authenticated)
      isLiked: currentUser ? comment.likedBy?.some(id => id.toString() === currentUser._id.toString()) || false : undefined,
      isDisliked: currentUser ? comment.dislikedBy?.some(id => id.toString() === currentUser._id.toString()) || false : undefined,

      replies: comment.replies?.map(reply => ({
        _id: reply._id,
        user: reply.user._id,
        username: reply.user.username,
        avatar: reply.user.avatar,
        avatarColor: reply.user.avatarColor,
        content: reply.content,
        likeCount: reply.likedBy?.length || 0,
        dislikeCount: reply.dislikedBy?.length || 0,
        createdAt: reply.createdAt,
        // User-specific like/dislike status for replies (only if user is authenticated)
        isLiked: currentUser ? reply.likedBy?.some(id => id.toString() === currentUser._id.toString()) || false : undefined,
        isDisliked: currentUser ? reply.dislikedBy?.some(id => id.toString() === currentUser._id.toString()) || false : undefined
      })) || []
    }));

    const totalComments = await Comment.countDocuments({
      contentId,
      contentType
    });

    const totalPages = Math.ceil(totalComments / limitNum);

    return c.json({
      success: true,
      comments: formattedComments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalComments,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    }, 200);

  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({
      success: false,
      message: 'Server error',
      error: error.message
    }, 500);
  }
});

// POST /api/comments/:contentType/:contentId - Post a new comment
router.post('/:contentType/:contentId', postLimiter, async (c) => {
  try {
    const { contentType, contentId } = c.req.param();
    const { content, token } = await c.req.json();

    if (!['video', 'image'].includes(contentType)) {
      return c.json({
        success: false,
        message: 'Invalid content type'
      }, 400);
    }

    const contentExists = await verifyContentExists(contentId, contentType);
    if (!contentExists) {
      return c.json({
        success: false,
        message: 'Content not found'
      }, 404);
    }

    const { user, error } = await verifyTokenAndGetUser(token);
    if (!user) {
      return c.json({
        success: false,
        message: error || 'Authentication required'
      }, 401);
    }

    if (!validateContent(content)) {
      return c.json({
        success: false,
        message: 'Comment content must be between 1 and 1000 characters'
      }, 400);
    }

    const sanitizedContent = sanitizeContent(content);

    const newComment = new Comment({
      contentId,
      contentType,
      user: user._id,
      content: sanitizedContent,
      likedBy: [],
      dislikedBy: [],
      replies: []
    });

    await newComment.save();

    const formattedComment = {
      _id: newComment._id,
      user: newComment.user,
      username: user.username,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      content: newComment.content,
      likeCount: 0,
      dislikeCount: 0,
      replyCount: 0,
      createdAt: newComment.createdAt,
      replies: []
    };

    return c.json({
      success: true,
      message: 'Comment posted successfully',
      comment: formattedComment
    }, 201);

  } catch (error) {
    console.error('Post comment error:', error);
    return c.json({
      success: false,
      message: 'Server error',
      error: error.message
    }, 500);
  }
});

export default router