import { Hono } from 'hono'
import User from '../models/User.js'
import { rateLimiter } from 'hono-rate-limiter'
import jwt from 'jsonwebtoken'
import sharp from 'sharp'
import { config } from "dotenv"
import { promises as fs } from 'fs'
import path from 'path'

config()

const router = new Hono()

const JWT_SECRET = process.env.JWT_SECRET
const STREAM_BASE_DIR = '/var/www/stream'

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const generateAvatarSlug = async (username) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `avatar-${username}-${timestamp}-${random}`
}

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

const deletePreviousAvatar = async (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.startsWith('/stream/')) {
    return 
  }
  
  try {
    const fullPath = path.join('/var/www', avatarUrl)
    await fs.unlink(fullPath)
    console.log(`Deleted previous avatar: ${avatarUrl}`)

    const dirPath = path.dirname(fullPath)
    try {
      const files = await fs.readdir(dirPath)
      if (files.length === 0) {
        await fs.rmdir(dirPath)
        console.log(`Removed empty avatar directory: ${dirPath}`)
      }
    } catch (error) {
    }
  } catch (error) {
    console.warn(`Failed to delete previous avatar ${avatarUrl}:`, error.message)
  }
}

const saveAvatarToStream = async (avatarFile, slug) => {
  try {
    const imageBuffer = await avatarFile.arrayBuffer()
    const workDir = path.join(STREAM_BASE_DIR, slug)
    const avatarPath = path.join(workDir, 'avatar.webp')

    await ensureDirectoryExists(STREAM_BASE_DIR)
    await ensureDirectoryExists(workDir)

    await sharp(Buffer.from(imageBuffer))
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(avatarPath)

    return `/stream/${slug}/avatar.webp`
  } catch (error) {
    console.error('Error saving avatar to stream:', error)
    throw new Error(`Failed to save avatar: ${error.message}`)
  }
}

router.post('/', limiter, async (c) => {
  try {
    if (!JWT_SECRET) {
      console.error('Server configuration error: Missing JWT_SECRET')
      return c.json({ 
        success: false, 
        message: 'Server configuration error' 
      }, 500)
    }

    const formData = await c.req.formData()
    const token = formData.get('token')
    const avatarFile = formData.get('avatar')

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication token is required' 
      }, 401)
    }

    if (!avatarFile || !(avatarFile instanceof File) || avatarFile.size === 0) {
      return c.json({ 
        success: false, 
        message: 'Avatar image file is required' 
      }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(avatarFile.type)) {
      return c.json({ 
        success: false, 
        message: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF images only.' 
      }, 400)
    }

    const maxSize = 10 * 1024 * 1024
    if (avatarFile.size > maxSize) {
      return c.json({ 
        success: false, 
        message: 'File size too large. Maximum size is 10MB.' 
      }, 400)
    }

    let decodedToken
    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return c.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, 401)
    }

    const user = await User.findOne({ email: decodedToken.email })
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'User not found' 
      }, 404)
    }

    const previousAvatarUrl = user.avatar
    const avatarSlug = await generateAvatarSlug(user.username)
    let newAvatarUrl
    try {
      newAvatarUrl = await saveAvatarToStream(avatarFile, avatarSlug)
    } catch (error) {
      console.error('Avatar save error:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to save avatar image. Please try again.' 
      }, 500)
    }

    user.avatar = newAvatarUrl
    user.updatedAt = new Date()
    await user.save()
    if (previousAvatarUrl) {
      deletePreviousAvatar(previousAvatarUrl).catch(error => {
        console.warn('Failed to delete previous avatar:', error.message)
      })
    }

    return c.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: newAvatarUrl
    }, 200)
    
  } catch (error) {
    console.error('Avatar update error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error while updating avatar' 
    }, 500)
  }
})

export default router