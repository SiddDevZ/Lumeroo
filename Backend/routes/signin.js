import { Hono } from 'hono'
import User from '../models/User.js'
import bcrypt from 'bcrypt'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

router.post('/', limiter, async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ 
        success: false, 
        message: 'Email and password are required' 
      }, 400)
    }

    const user = await User.findOne({ email })
    
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Email not found' 
      }, 200)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return c.json({ 
        success: false, 
        message: 'Invalid credentials' 
      }, 200)
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    
    return c.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token: user.token
    }, 200)
    
  } catch (error) {
    console.error('Signin error:', error)
    return c.json({ success: false, message: 'Server error', error: error.message }, 500)
  }
})

export default router