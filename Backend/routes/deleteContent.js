import { Hono } from 'hono'
import Video from '../models/Video.js'
import Image from '../models/Image.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { rateLimiter } from 'hono-rate-limiter'
import { config } from "dotenv";

config();

const router = new Hono()

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
})

const JWT_SECRET = process.env.JWT_SECRET;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH || CLOUDFLARE_ACCOUNT_ID;

const verifyTokenAndGetUser = async (token) => {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    return user ? user : null;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

const deleteVideoFromCloudflare = async (cloudflareStreamId) => {
  try {
    if (!cloudflareStreamId) {
      console.warn('No Cloudflare Stream ID provided for deletion');
      return false;
    }

    const response = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${cloudflareStreamId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.success) {
      console.log(`Successfully deleted video from Cloudflare Stream: ${cloudflareStreamId}`);
      return true;
    } else {
      const errorDetails = response.data?.errors ? JSON.stringify(response.data.errors) : 'No error details provided';
      console.error(`Failed to delete video from Cloudflare Stream: ${cloudflareStreamId}`, errorDetails);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Video already deleted or doesn't exist in Cloudflare Stream: ${cloudflareStreamId}`);
      return true;
    }
    
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`Error deleting video from Cloudflare Stream (${cloudflareStreamId}):`, errorDetails);
    return false;
  }
};

const deleteImageFromCloudflare = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('imagedelivery.net')) {
      console.warn('Invalid or non-Cloudflare image URL provided for deletion:', imageUrl);
      return false;
    }

    const urlParts = imageUrl.split('/');
    const imageId = urlParts[urlParts.length - 2];

    if (!imageId || imageId === 'public') {
      console.error('Could not extract image ID from URL:', imageUrl);
      return false;
    }

    const response = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.success) {
      console.log(`Successfully deleted image from Cloudflare Images: ${imageId}`);
      return true;
    } else {
      const errorDetails = response.data?.errors ? JSON.stringify(response.data.errors) : 'No error details provided';
      console.error(`Failed to delete image from Cloudflare Images: ${imageId}`, errorDetails);
      return false;
    }
  } catch (error) {
    // Check if it's a 404 error (image already deleted or doesn't exist)
    if (error.response?.status === 404) {
      // console.log(`Image already deleted or doesn't exist in Cloudflare Images: ${imageUrl}`);
      return true;
    }
    
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    // console.error(`Error deleting image from Cloudflare Images (${imageUrl}):`, errorDetails);
    return false;
  }
};

router.delete('/:type/:id', limiter, async (c) => {
  try {
    const { type, id } = c.req.param()
    const { token } = await c.req.json()

    if (!token) {
      return c.json({ 
        success: false, 
        message: 'Authentication token is required' 
      }, 401)
    }

    if (!id || !type) {
      return c.json({ 
        success: false, 
        message: 'Content ID and type are required' 
      }, 400)
    }

    if (type !== 'video' && type !== 'image') {
      return c.json({ 
        success: false, 
        message: 'Invalid content type. Must be "video" or "image"' 
      }, 400)
    }

    const user = await verifyTokenAndGetUser(token)
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, 401)
    }

    const Model = type === 'video' ? Video : Image
    const contentName = type === 'video' ? 'Video' : 'Image'

    const content = await Model.findById(id)
    if (!content) {
      return c.json({ 
        success: false, 
        message: `${contentName} not found` 
      }, 404)
    }

    const isAdmin = user.isAdmin === true;
    const isUploader = content.uploader.toString() === user._id.toString();
    if (!isAdmin && !isUploader) {
      return c.json({ 
        success: false, 
        message: `You do not have permission to delete this ${type}` 
      }, 403)
    }

    let cloudflareDeleteSuccess = true;
    
    if (type === 'video') {
      if (content.cloudflareStreamId) {
        cloudflareDeleteSuccess = await deleteVideoFromCloudflare(content.cloudflareStreamId);
      }

      if (content.thumbnail && content.thumbnail.includes('imagedelivery.net')) {
        await deleteImageFromCloudflare(content.thumbnail);
      }
    } else if (type === 'image') {
      if (content.imageUrls && content.imageUrls.length > 0) {
        const deletePromises = content.imageUrls.map(imageUrl => deleteImageFromCloudflare(imageUrl));
        const results = await Promise.allSettled(deletePromises);

        const failedDeletions = results.filter(result => result.status === 'rejected' || !result.value);
        if (failedDeletions.length > 0) {
          console.warn(`Some images failed to delete from Cloudflare for image set ${id}`);
          cloudflareDeleteSuccess = false;
        }
      }
    }

    await Model.findByIdAndDelete(id)

    if (!cloudflareDeleteSuccess) {
      // console.warn(`${contentName} deleted from database but some Cloudflare files may not have been deleted: ${id}`);
      return c.json({
        success: true,
        message: `${contentName} deleted successfully`,
      }, 200)
    }

    return c.json({
      success: true,
      message: `${contentName} deleted successfully`
    }, 200)
    
  } catch (error) {
    console.error('Delete content error:', error)
    return c.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, 500)
  }
})

export default router