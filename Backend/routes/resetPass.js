import { Hono } from 'hono'
import User from '../models/User.js'
import PendingPasswordReset from '../models/PendingPasswordReset.js'
import { rateLimiter } from 'hono-rate-limiter'
import { generateOTP, sendVerificationEmail } from '../utils/emailUtils.js'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10, // Restrictive limit to prevent abuse
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const validateEmail = (email) => {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return email && emailPattern.test(email)
}

router.post('/', limiter, async (c) => {
  try {
    const { email } = await c.req.json()

    if (!validateEmail(email)) {
      return c.json({
        success: false,
        message: 'Please provide a valid email address',
        errors: { email: 'Please enter a valid email address' }
      }, 400)
    }

    const user = await User.findOne({ email })
    
    if (!user) {
      return c.json({
        success: false,
        message: 'No account found with this email address',
        valid: false
      }, 200)
    }

    const otp = generateOTP()

    await PendingPasswordReset.findOneAndUpdate(
      { email },
      { email, otp },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    try {
      await sendVerificationEmail(email, otp, 'password-reset')
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      return c.json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      }, 500)
    }
    
    return c.json({
      success: true,
      message: 'Password reset code sent to your email address.',
      valid: true
    }, 200)
    
  } catch (error) {
    console.error('Password reset request error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error' 
    }, 500)
  }
})

export default router