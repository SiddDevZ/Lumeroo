import { Hono } from 'hono';
import { promises as fs } from 'fs';
import path from 'path';
import Image, { generateSlug, generateRandomSuffix } from '../models/Image.js';
import User from '../models/User.js';
import { config } from "dotenv";
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

config();

const router = new Hono();
const JWT_SECRET = process.env.JWT_SECRET;
const STREAM_BASE_DIR = '/var/www/stream';

const verifyTokenAndGetUserId = (token) => {
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.email;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

const generateUniqueSlug = async (title) => {
  const baseSlug = generateSlug(title);
  const randomSuffix = generateRandomSuffix();
  let slug = `${baseSlug}-${randomSuffix}`;

  let counter = 1;
  while (await Image.findOne({ slug: slug })) {
    slug = `${baseSlug}-${randomSuffix}${counter}`;
    counter++;
  }

  return slug;
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const processAndSaveImage = async (imageFile, slug, imageIndex) => {
  try {
    const imageBuffer = await imageFile.arrayBuffer();
    const workDir = path.join(STREAM_BASE_DIR, slug);
    const imagePath = path.join(workDir, `image_${imageIndex}.webp`);

    await ensureDirectoryExists(workDir);

    await sharp(Buffer.from(imageBuffer))
      .webp({ quality: 85 })
      .toFile(imagePath);

    return `/stream/${slug}/image_${imageIndex}.webp`;
  } catch (error) {
    console.error(`Error processing image ${imageIndex}:`, error);
    throw new Error(`Failed to process image ${imageIndex + 1}: ${error.message}`);
  }
};

const cleanupFiles = async (slug, imageCount) => {
  try {
    const workDir = path.join(STREAM_BASE_DIR, slug);
    for (let i = 0; i < imageCount; i++) {
      const imagePath = path.join(workDir, `image_${i}.webp`);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn(`Failed to cleanup image ${i}:`, error.message);
      }
    }
    try {
      const files = await fs.readdir(workDir);
      if (files.length === 0) {
        await fs.rmdir(workDir);
      }
    } catch (error) {
      console.warn('Failed to cleanup work directory:', error.message);
    }
  } catch (error) {
    console.warn('Error during cleanup:', error.message);
  }
};

router.post('/', async (c) => {
  try {
    const formData = await c.req.formData();
    const token = formData.get('token');
    const userEmail = verifyTokenAndGetUserId(token);

    if (!userEmail) {
      return c.json({ success: false, message: 'Invalid or missing token. Authentication required.' }, 401);
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return c.json({ success: false, message: 'User not found.' }, 404);
    }

    const title = formData.get('title');
    const description = formData.get('description');
    const tagsString = formData.get('tags');
    const thumbnailIndex = parseInt(formData.get('thumbnailIndex')) || 0;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return c.json({ success: false, message: 'Title is required.' }, 400);
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return c.json({ success: false, message: 'Description is required.' }, 400);
    }

    const imageFiles = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('imageFile') && value instanceof File && value.size > 0) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length === 0) {
      return c.json({ success: false, message: 'At least one image file is required.' }, 400);
    }

    if (imageFiles.length > 12) {
      return c.json({ success: false, message: 'Maximum 12 images allowed per upload.' }, 400);
    }

    if (thumbnailIndex < 0 || thumbnailIndex >= imageFiles.length) {
      return c.json({ success: false, message: 'Invalid thumbnail index.' }, 400);
    }

    const slug = await generateUniqueSlug(title.trim());

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!allowedImageTypes.includes(file.type)) {
        return c.json({ 
          success: false, 
          message: `Image ${i + 1} must be a valid image file (JPEG, PNG, WebP, GIF).` 
        }, 400);
      }
      
      const maxImageSize = 50 * 1024 * 1024;
      if (file.size > maxImageSize) {
        return c.json({ 
          success: false, 
          message: `Image ${i + 1} size must be less than 50MB.` 
        }, 400);
      }
    }

    console.log(`Processing ${imageFiles.length} images for slug: ${slug}`);
    const uploadPromises = imageFiles.map((file, index) => 
      processAndSaveImage(file, slug, index).catch(error => {
        error.fileName = file.name;
        error.fileIndex = index;
        throw error;
      })
    );
    
    let imageUrls;
    try {
      imageUrls = await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error processing images:', error.message);

      await cleanupFiles(slug, imageFiles.length);
      
      const fileInfo = error.fileName ? ` (File: "${error.fileName}", Position: ${(error.fileIndex || 0) + 1})` : '';
      
      return c.json({ 
        success: false, 
        message: `Failed to process images${fileInfo}. ${error.message}`,
      }, 500);
    }

    const tags = tagsString && typeof tagsString === 'string' 
      ? tagsString.split(' ').map(tag => tag.trim()).filter(tag => tag.length > 0) 
      : [];

    const imageData = {
      title: title.trim(),
      description: description.trim(),
      slug: slug,
      imageUrls: imageUrls,
      thumbnailIndex: thumbnailIndex,
      uploader: user._id,
      tags: tags,
    };

    const newImage = new Image(imageData);
    await newImage.save();

    console.log(`Image upload completed successfully: ${slug}`);

    return c.json({
      success: true,
      message: 'Images uploaded successfully!',
      image: newImage.toObject(),
    }, 201);

  } catch (error) {
    console.error('Error in POST /uploadImage route:', error);
    if (error.code === 11000) {
      return c.json({ success: false, message: 'This image content seems to have already been uploaded.' }, 409);
    }
    return c.json({ success: false, message: 'An unexpected server error occurred.' }, 500);
  }
});

export default router;