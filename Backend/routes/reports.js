import { Hono } from 'hono'
import Report from '../models/Report.js'
import User from '../models/User.js'
import Video from '../models/Video.js'
import Image from '../models/Image.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50,
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
    return user;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

// Submit a new report
router.post('/', limiter, async (c) => {
  try {
    const { token, contentId, contentType, category, details } = await c.req.json()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication required' 
      }, 401)
    }

    const user = await verifyTokenAndGetUser(token);
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, 401)
    }

    if (!contentId || !contentType || !category) {
      return c.json({ 
        success: false, 
        message: 'Content ID, content type, and category are required' 
      }, 400)
    }

    if (!['video', 'image'].includes(contentType)) {
      return c.json({ 
        success: false, 
        message: 'Invalid content type' 
      }, 400)
    }

    let content;
    let contentSnapshot = {};

    if (contentType === 'video') {
      content = await Video.findById(contentId).populate('uploader', 'username');
    } else {
      content = await Image.findById(contentId).populate('uploader', 'username');
    }

    if (!content) {
      return c.json({ 
        success: false, 
        message: 'Content not found' 
      }, 404)
    }

    contentSnapshot = {
      title: content.title,
      slug: content.slug,
      uploaderUsername: content.uploader?.username || 'Unknown',
      uploadedAt: content.createdAt || content.uploadDate
    };

    const existingReport = await Report.findOne({
      reporter: user._id,
      contentId,
      contentType
    });

    if (existingReport) {
      return c.json({ 
        success: false, 
        message: 'You have already reported this content' 
      }, 409)
    }

    const report = new Report({
      reporter: user._id,
      contentId,
      contentType,
      category,
      details: details?.trim() || '',
      contentSnapshot
    });

    await report.save();

    return c.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      reportId: report._id
    }, 201)

  } catch (error) {
    console.error('Report submission error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error' 
    }, 500)
  }
})

// Get all reports (Admin only)
router.get('/admin', limiter, async (c) => {
  try {
    const { token } = c.req.query()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication required' 
      }, 401)
    }

    const user = await verifyTokenAndGetUser(token);
    if (!user || !user.isAdmin) {
      return c.json({ 
        success: false, 
        message: 'Admin access required' 
      }, 403)
    }

    const reports = await Report.find({})
      .populate('reporter', 'username email avatar avatarColor')
      .sort({ createdAt: -1 });

    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reportObj = report.toObject();

      if (!reportObj.contentSnapshot?.slug && reportObj.contentId) {
        try {
          let content;
          if (reportObj.contentType === 'video') {
            content = await Video.findById(reportObj.contentId).select('slug');
          } else {
            content = await Image.findById(reportObj.contentId).select('slug');
          }
          
          if (content && content.slug) {
            reportObj.contentSnapshot = {
              ...reportObj.contentSnapshot,
              slug: content.slug
            };
          }
        } catch (error) {
          console.error(`Error fetching slug for ${reportObj.contentType} ${reportObj.contentId}:`, error);
        }
      }
      
      return reportObj;
    }));

    return c.json({
      success: true,
      reports: enrichedReports
    }, 200)

  } catch (error) {
    console.error('Admin reports retrieval error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error' 
    }, 500)
  }
})

// Delete report (Admin only)
router.delete('/admin/:reportId', limiter, async (c) => {
  try {
    const { reportId } = c.req.param()
    const { token } = c.req.query()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication required' 
      }, 401)
    }

    const user = await verifyTokenAndGetUser(token);
    if (!user || !user.isAdmin) {
      return c.json({ 
        success: false, 
        message: 'Admin access required' 
      }, 403)
    }

    const report = await Report.findByIdAndDelete(reportId);

    if (!report) {
      return c.json({ 
        success: false, 
        message: 'Report not found' 
      }, 404)
    }

    return c.json({
      success: true,
      message: 'Report deleted successfully'
    }, 200)

  } catch (error) {
    console.error('Report deletion error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error' 
    }, 500)
  }
})

export default router