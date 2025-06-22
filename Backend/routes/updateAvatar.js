import { Hono } from 'hono'
import User from '../models/User.js'
import { rateLimiter } from 'hono-rate-limiter'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import FormDataNode from 'form-data'
import sharp from 'sharp'
import { config } from "dotenv"

config()

const router = new Hono()

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH || CLOUDFLARE_ACCOUNT_ID
const JWT_SECRET = process.env.JWT_SECRET

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const uploadImageToCloudflare = async (imageFile) => {
  try {
    const imageBuffer = await imageFile.arrayBuffer()

    const webpBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer()

    const directUploadForm = new FormDataNode()
    directUploadForm.append('requireSignedURLs', 'false')

    const directUploadResponse = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
      directUploadForm,
      {
        headers: {
          ...directUploadForm.getHeaders(),
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    )

    const { uploadURL, id: imageId } = directUploadResponse.data.result
    if (!uploadURL || !imageId) {
      throw new Error('Failed to get Cloudflare image direct upload URL.')
    }

    const imageFormData = new FormDataNode()
    const originalFileName = imageFile.name
    const webpFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) + '.webp'
    imageFormData.append('file', webpBuffer, webpFileName)

    await axios.post(uploadURL, imageFormData, {
      headers: imageFormData.getHeaders(),
    })

    return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`
  } catch (error) {
    console.error('Error uploading image to Cloudflare:', error.response ? JSON.stringify(error.response.data) : error.message)
    throw error
  }
}

router.post('/', limiter, async (c) => {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !JWT_SECRET) {
      console.error('Server configuration error: Missing required environment variables')
      return c.json({ 
        success: false, 
        message: 'Server configuration error' 
      }, 500)
    }

    const formData = await c.req.formData()
    const token = formData.get('token')
    const avatarFile = formData.get('avatar')

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication token is required' 
      }, 401)
    }

    if (!avatarFile || !(avatarFile instanceof File) || avatarFile.size === 0) {
      return c.json({ 
        success: false, 
        message: 'Avatar image file is required' 
      }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(avatarFile.type)) {
      return c.json({ 
        success: false, 
        message: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF images only.' 
      }, 400)
    }

    const maxSize = 10 * 1024 * 1024
    if (avatarFile.size > maxSize) {
      return c.json({ 
        success: false, 
        message: 'File size too large. Maximum size is 10MB.' 
      }, 400)
    }

    let decodedToken
    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
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

    let avatarUrl
    try {
      avatarUrl = await uploadImageToCloudflare(avatarFile)
    } catch (error) {
      console.error('Avatar upload error:', error)
      return c.json({ 
        success: false, 
        message: 'Failed to upload avatar image. Please try again.' 
      }, 500)
    }

    user.avatar = avatarUrl
    user.updatedAt = new Date()
    await user.save()

    return c.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: avatarUrl
    }, 200)
    
  } catch (error) {
    console.error('Avatar update error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error while updating avatar' 
    }, 500)
  }
})

export default router