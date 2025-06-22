import { Hono } from 'hono'
import User from '../models/User.js'
import { rateLimiter } from 'hono-rate-limiter'
import jwt from 'jsonwebtoken'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const validateUsername = (username) => {
  return username && 
         username.length >= 3 && 
         username.length <= 16 && 
         /^[a-zA-Z0-9]+$/.test(username)
}

router.post('/', limiter, async (c) => {
  try {
    const { token, username } = await c.req.json()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication token is required' 
      }, 401)
    }

    if (!validateUsername(username)) {
      return c.json({ 
        success: false, 
        message: 'Username must be 3-16 characters and can only contain letters and numbers' 
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

    // Check if username is already taken
    const existingUser = await User.findOne({ 
      username: username,
      _id: { $ne: user._id }
    })
    
    if (existingUser) {
      return c.json({ 
        success: false, 
        message: 'Username is already taken. Please choose a different one.' 
      }, 409)
    }

    user.username = username.trim()
    user.updatedAt = new Date()
    await user.save()

    return c.json({
      success: true,
      message: 'Username updated successfully',
      username: user.username
    }, 200)
    
  } catch (error) {
    console.error('Username update error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error while updating username' 
    }, 500)
  }
})

export default router