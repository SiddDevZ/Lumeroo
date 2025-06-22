import { Hono } from 'hono'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

router.post('/', limiter, async (c) => {
  try {
    const { email, token } = await c.req.json()
    
    if (!token) {
      return c.json({
        success: false,
        message: 'Authorization token is required'
      }, 401)
    }
    
    if (!email) {
      return c.json({
        success: false,
        message: 'Email is required'
      }, 400)
    }

    const user = await User.findOne({ email })
    
    if (!user) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')

      if (decoded.email !== email) {
        return c.json({
          success: false,
          message: 'Unauthorized to delete this user'
        }, 403)
      }
      
      if (user.token !== token) {
        return c.json({
          success: false,
          message: 'Invalid token'
        }, 403)
      }

      await User.deleteOne({ email })
      
      return c.json({
        success: true,
        message: 'User deleted successfully'
      }, 200)
      
    } catch (jwtError) {
      return c.json({
        success: false,
        message: 'Invalid or expired token'
      }, 401)
    }
    
  } catch (error) {
    console.error('Delete user error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500)
  }
})

export default router