import { Hono } from 'hono'
import User from '../models/User.js'
import { rateLimiter } from 'hono-rate-limiter'
import jwt from 'jsonwebtoken'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const validateBio = (bio) => {
  return typeof bio === 'string' && bio.length <= 300
}

router.post('/', limiter, async (c) => {
  try {
    const { token, bio } = await c.req.json()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication token is required' 
      }, 401)
    }

    if (!validateBio(bio)) {
      return c.json({ 
        success: false, 
        message: 'Bio must be a string with maximum 300 characters' 
      }, 400)
    }

    let decodedToken
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET)
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

    user.bio = bio.trim()
    user.updatedAt = new Date()
    await user.save()

    return c.json({
      success: true,
      message: 'Bio updated successfully',
      bio: user.bio
    }, 200)
    
  } catch (error) {
    console.error('Bio update error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error while updating bio' 
    }, 500)
  }
})

export default router