import { Hono } from 'hono'
import User from '../models/User.js'
import { rateLimiter } from 'hono-rate-limiter'
import jwt from 'jsonwebtoken'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

router.post('/', limiter, async (c) => {
  try {
    const { token } = await c.req.json()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Token is required' 
      }, 400)
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
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

    const userResponse = user.toObject();
    delete userResponse.password;
    
    return c.json({
      success: true,
      message: 'Authentication successful',
      user: userResponse
    }, 200)
    
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ success: false, message: 'Server error', error: error.message }, 500)
  }
})

export default router