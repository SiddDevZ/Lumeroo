import { Hono } from 'hono'
import PendingUser from '../models/PendingUser.js'
import { rateLimiter } from 'hono-rate-limiter'
import { sendVerificationEmail } from '../utils/emailUtils.js'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10, // More restrictive limit for resend to prevent abuse
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

    const pendingUser = await PendingUser.findOne({ email })
    
    if (!pendingUser) {
      return c.json({
        success: false,
        message: 'No pending registration found for this email'
      }, 404)
    }

    const existingOTP = pendingUser.otp

    try {
      await sendVerificationEmail(email, existingOTP)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return c.json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      }, 500)
    }
    
    return c.json({
      success: true,
      message: 'Verification code resent to your email address.'
    }, 200)
    
  } catch (error) {
    console.error('Resend OTP error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error' 
    }, 500)
  }
})

export default router