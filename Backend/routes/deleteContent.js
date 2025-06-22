import { Hono } from 'hono'
import Video from '../models/Video.js'
import Image from '../models/Image.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'
import { config } from "dotenv"
import { promises as fs } from 'fs'
import path from 'path'

config();

const router = new Hono()
const STREAM_BASE_DIR = '/var/www/stream'

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
    return user ? user : null;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

const deleteLocalStreamFiles = async (content) => {
  try {
    if (content.slug) {
      const contentDir = path.join(STREAM_BASE_DIR, content.slug)
      try {
        await fs.rm(contentDir, { recursive: true, force: true })
        console.log(`Deleted content directory: ${contentDir}`)
        return true
      } catch (error) {
        console.warn(`Failed to delete content directory ${contentDir}:`, error.message)
        return false
      }
    }
    return false
  } catch (error) {
    console.warn(`Error deleting local stream files:`, error.message)
    return false
  }
}

router.delete('/:type/:id', limiter, async (c) => {
  try {
    const { type, id } = c.req.param()
    const { token } = await c.req.json()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication token is required' 
      }, 401)
    }

    if (!id || !type) {
      return c.json({ 
        success: false, 
        message: 'Content ID and type are required' 
      }, 400)
    }

    if (type !== 'video' && type !== 'image') {
      return c.json({ 
        success: false, 
        message: 'Invalid content type. Must be "video" or "image"' 
      }, 400)
    }

    const user = await verifyTokenAndGetUser(token)
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, 401)
    }

    const Model = type === 'video' ? Video : Image
    const contentName = type === 'video' ? 'Video' : 'Image'

    const content = await Model.findById(id)
    if (!content) {
      return c.json({ 
        success: false, 
        message: `${contentName} not found` 
      }, 404)
    }

    const isAdmin = user.isAdmin === true;
    const isUploader = content.uploader.toString() === user._id.toString();
    if (!isAdmin && !isUploader) {
      return c.json({ 
        success: false, 
        message: `You do not have permission to delete this ${type}` 
      }, 403)
    }

    const localDeleteSuccess = await deleteLocalStreamFiles(content)

    await Model.findByIdAndDelete(id)

    if (!localDeleteSuccess) {
      console.warn(`${contentName} deleted from database but local files may not have been deleted: ${id}`);
    }

    return c.json({
      success: true,
      message: `${contentName} deleted successfully`
    }, 200)
    
  } catch (error) {
    console.error('Delete content error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500)
  }
})

export default router