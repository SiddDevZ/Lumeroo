import { Hono } from 'hono'
import User from '../models/User.js'
import PendingPasswordReset from '../models/PendingPasswordReset.js'
import bcrypt from 'bcrypt'
import { rateLimiter } from 'hono-rate-limiter'

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

const validateOTP = (otp) => {
  return otp && /^\d{4}$/.test(otp)
}

const validatePassword = (password) => {
  return password && password.length >= 6
}

router.post('/', limiter, async (c) => {
  try {
    const { email, otp, newPassword } = await c.req.json()

    const errors = {}
    
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!validateOTP(otp)) {
      errors.otp = 'Please enter a valid 4-digit verification code'
    }

    if (!validatePassword(newPassword)) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (Object.keys(errors).length > 0) {
      return c.json({
        success: false,
        message: 'Validation failed',
        errors
      }, 400)
    }

    const pendingReset = await PendingPasswordReset.findOne({ email })
    
    if (!pendingReset) {
      return c.json({
        success: false,
        message: 'Password reset failed. Please request a new code.',
        valid: false
      }, 400)
    }

    if (pendingReset.otp !== otp) {
      return c.json({
        success: false,
        message: 'Invalid verification code. Please try again.',
        valid: false
      }, 400)
    }

    if (!pendingReset.verified) {
      return c.json({
        success: false,
        message: 'Please verify your code first before setting a new password.',
        valid: false
      }, 400)
    }

    const user = await User.findOne({ email })
    
    if (!user) {
      return c.json({
        success: false,
        message: 'User not found.',
        valid: false
      }, 404)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    user.password = hashedPassword
    await user.save()

    await PendingPasswordReset.deleteOne({ email })
    
    return c.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.',
      valid: true
    }, 200)
    
  } catch (error) {
    console.error('Password reset completion error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error' 
    }, 500)
  }
})

export default router