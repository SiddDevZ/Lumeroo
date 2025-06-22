import { Hono } from 'hono'
import User from '../models/User.js'
import PendingUser from '../models/PendingUser.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 25, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const validateEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return email && emailPattern.test(email)
}

const validateOTP = (otp) => {
  return otp && /^\d{4}$/.test(otp)
}

router.post('/', limiter, async (c) => {
  try {
    const { email, otp } = await c.req.json()

    const errors = {}
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!validateOTP(otp)) {
      errors.otp = 'Please enter a valid 4-digit verification code'
    }
    
    if (Object.keys(errors).length > 0) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors
      }, 400)
    }

    const pendingUser = await PendingUser.findOne({ email })
    
    if (!pendingUser) {
      return c.json({
        success: false,
        message: 'Verification failed. Please request a new code.'
      }, 404)
    }

    if (pendingUser.otp !== otp) {
      return c.json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      }, 400)
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'fallback_secret',
    )

    const newUser = new User({
      username: pendingUser.username,
      email: pendingUser.email,
      password: pendingUser.password,
      token
    })
    
    await newUser.save()

    await PendingUser.deleteOne({ email })

    const userResponse = newUser.toObject()
    delete userResponse.password
    
    return c.json({
      success: true,
      message: 'User registered successfully!',
      user: userResponse
    }, 201)
    
  } catch (error) {
    console.error('Verification error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error'
    }, 500)
  }
})

export default router