import { Hono } from 'hono'
import User from '../models/User.js'
import PendingUser from '../models/PendingUser.js'
import bcrypt from 'bcrypt'
import { rateLimiter } from 'hono-rate-limiter'
import { generateOTP, sendVerificationEmail } from '../utils/emailUtils.js'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const validateEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return email && emailPattern.test(email)
}

const validateUsername = (username) => {
  return username && 
         username.length >= 3 && 
         username.length <= 16 && 
         /^[a-zA-Z0-9]+$/.test(username)
}

const validatePassword = (password) => {
  return password && password.length >= 6
}

router.post('/', limiter, async (c) => {
  try {
    const { username, email, password } = await c.req.json()

    const errors = {}
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!validateUsername(username)) {
      errors.username = 'Username must be 3-16 characters and can only contain letters and numbers'
    }
    
    if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (Object.keys(errors).length > 0) {
      return c.json({ 
        success: false, 
        message: 'Validation failed',
        errors
      }, 400)
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })
    
    if (existingUser) {
      return c.json({ 
        success: false, 
        message: existingUser.email === email ? 'Email already in use' : 'Username already taken' 
      }, 409)
    }

    const otp = generateOTP()

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const pendingUser = {
      username,
      email,
      password: hashedPassword,
      otp
    }

    await PendingUser.findOneAndUpdate(
      { email },
      pendingUser,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    try {
      await sendVerificationEmail(email, otp)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return c.json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      }, 500)
    }
    
    return c.json({
      success: true,
      message: 'Verification code sent to your email address.',
      // email
    }, 200)
    
  } catch (error) {

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return c.json({
        success: false,
        message: `This ${field} is already in use. Please try again with a different ${field}.`
      }, 409)
    }
    
    return c.json({ 
      success: false, 
      message: 'Server error'
    }, 500)
  }
})

export default router