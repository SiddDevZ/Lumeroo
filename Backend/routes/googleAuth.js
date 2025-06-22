import { Hono } from 'hono'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { rateLimiter } from 'hono-rate-limiter'
import crypto from 'crypto'

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const generateUniqueUsername = async (baseName) => {
  let username = baseName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)

  if (username.length < 3) {
    username = 'user' + Math.floor(Math.random() * 10000)
  }
  
  let finalUsername = username
  let counter = 1

  while (await User.findOne({ username: finalUsername })) {
    finalUsername = username.substring(0, 13) + counter
    counter++
  }
  
  return finalUsername
}

router.post('/', limiter, async (c) => {
  try {
    const { email, name, picture, sub: googleId } = await c.req.json()
    
    if (!email || !name) {
      return c.json({
        success: false,
        message: 'Missing required Google account information'
      }, 400)
    }

    let user = await User.findOne({ email })
    
    if (user) {
      user.updatedAt = new Date()

      if (picture && !user.avatar) {
        user.avatar = picture
      }
      
      await user.save()

      const userResponse = user.toObject()
      delete userResponse.password
      
      return c.json({
        success: true,
        message: 'Login successful',
        user: userResponse
      }, 200)
      
    } else {
      const username = await generateUniqueUsername(name)
      
      const token = jwt.sign(
        { email },
        process.env.JWT_SECRET || 'fallback_secret'
      )

      const randomPassword = crypto.randomBytes(32).toString('hex')
      
      const newUser = new User({
        username,
        email,
        password: randomPassword,
        avatar: picture || null,
        token,
        bio: ''
      })
      
      await newUser.save()

      const userResponse = newUser.toObject()
      delete userResponse.password
      
      return c.json({
        success: true,
        message: 'Account created successfully',
        user: userResponse
      }, 201)
    }
    
  } catch (error) {
    console.error('Google auth error:', error)
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return c.json({
        success: false,
        message: `This ${field} is already in use. Please try again.`
      }, 409)
    }
    
    return c.json({
      success: false,
      message: 'Authentication failed. Please try again.'
    }, 500)
  }
})

export default router