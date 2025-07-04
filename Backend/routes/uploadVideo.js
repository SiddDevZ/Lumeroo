import { Hono } from 'hono';
import { spawn, execSync } from 'child_process';
import { promises as fs, existsSync } from 'fs';
import path from 'path';
import Video, { generateSlug, generateRandomSuffix } from '../models/Video.js';
import User from '../models/User.js';
import { config } from "dotenv";
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

config();

const router = new Hono();
const JWT_SECRET = process.env.JWT_SECRET;
const STREAM_BASE_DIR = '/var/www/stream';

const findExecutable = (name) => {
  // 1. Use 'which' command on non-Windows platforms. It's the most reliable.
  if (process.platform !== 'win32') {
    try {
      // execSync will throw if the command is not found.
      const systemPath = execSync(`which ${name}`, { encoding: 'utf8' }).trim();
      if (systemPath && existsSync(systemPath)) {
        console.log(`Found ${name} in system PATH: ${systemPath}`);
        return systemPath;
      }
    } catch (e) {
      // Command not found, which is fine. We'll try the next method.
      console.warn(`'${name}' not found in system PATH. Falling back to static package.`);
    }
  }

  // 2. Fallback to the -static package path (ideal for local Windows dev).
  const staticPackage = name === 'ffmpeg' ? ffmpegStatic : ffprobeStatic?.path;
  const staticPath = typeof staticPackage === 'string' ? staticPackage : null;
  if (staticPath && existsSync(staticPath)) {
    console.log(`Found ${name} via static package: ${staticPath}`);
    return staticPath;
  }

  // 3. Last resort: return the name and hope it's in the PATH for spawn.
  console.error(`Could not find a valid path for ${name}. Please install it globally or check your configuration.`);
  return name;
};

const ffmpegPath = findExecutable('ffmpeg');
const ffprobePath = findExecutable('ffprobe');

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
  while (await Video.findOne({ slug: slug })) {
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

const runFFmpegCommand = (args) => {
  return new Promise((resolve, reject) => {
    console.log(`Using FFmpeg path: ${ffmpegPath}`);
    console.log(`Running FFmpeg command with args:`, args);
    
    const ffmpeg = spawn(ffmpegPath, args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(`FFmpeg failed with code ${code}: ${stderr}`);
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error(`FFmpeg spawn error:`, error);
      reject(new Error(`FFmpeg spawn error: ${error.message}`));
    });
  });
};

const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Failed to cleanup file ${filePath}:`, error.message);
    }
  }
};

router.post('/', async (c) => {
  let workDir = null;
  let inputPath = null;
  let thumbPngPath = null;
  let videoDuration = null; // Correctly scoped variable for duration

  try {
    if (!JWT_SECRET) {
      console.error('Server configuration error: JWT_SECRET missing.');
      return c.json({ success: false, message: 'Server configuration error.' }, 500);
    }

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
    const videoFile = formData.get('videoFile');
    const thumbnailFile = formData.get('thumbnailFile');
    const clientDuration = formData.get('duration');

    const parsedClientDuration = clientDuration ? parseFloat(clientDuration) : null;
    // console.log(`Client provided duration: ${parsedClientDuration}`);

    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return c.json({ success: false, message: 'Video file is required and must be a valid file.' }, 400);
    }
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return c.json({ success: false, message: 'Title is required.' }, 400);
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return c.json({ success: false, message: 'Description is required.' }, 400);
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!allowedTypes.includes(videoFile.type)) {
      return c.json({ success: false, message: 'Only video files (MP4, WebM, AVI, MOV) are allowed.' }, 400);
    }

    const maxSize = 1 * 1024 * 1024 * 1024; // 2GB
    if (videoFile.size > maxSize) {
      return c.json({ success: false, message: 'Video file size must be less than 1GB.' }, 400);
    }

    if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedImageTypes.includes(thumbnailFile.type)) {
        return c.json({ success: false, message: 'Thumbnail must be a valid image file (JPEG, PNG, WebP).' }, 400);
      }
      
      const maxThumbnailSize = 30 * 1024 * 1024;
      if (thumbnailFile.size > maxThumbnailSize) {
        return c.json({ success: false, message: 'Thumbnail file size must be less than 30MB.' }, 400);
      }
    }

    const slug = await generateUniqueSlug(title.trim());
    workDir = path.join(STREAM_BASE_DIR, slug);
    inputPath = path.join(workDir, 'input.mp4');
    const hlsPath = path.join(workDir, 'video.m3u8');
    thumbPngPath = path.join(workDir, 'thumb.png');
    const thumbWebpPath = path.join(workDir, 'thumb.webp');

    await ensureDirectoryExists(STREAM_BASE_DIR);
    await ensureDirectoryExists(workDir);

    const videoBuffer = await videoFile.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(videoBuffer));

    // --- Correctly placed duration calculation ---
    console.log('Attempting to extract video duration...');
    try {
        const getDurationArgs = [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            inputPath
        ];
        const durationResult = await new Promise((resolve, reject) => {
            const ffprobe = spawn(ffprobePath, getDurationArgs);
            let stdout = '';
            let stderr = '';
            ffprobe.stdout.on('data', (data) => { stdout += data.toString(); });
            ffprobe.stderr.on('data', (data) => { stderr += data.toString(); });
            ffprobe.on('close', (code) => {
                if (code === 0 && stdout.trim()) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`FFprobe failed. Code: ${code}. Stderr: ${stderr}`));
                }
            });
            ffprobe.on('error', reject);
        });
        const parsedDuration = parseFloat(durationResult);
        if (!isNaN(parsedDuration) && parsedDuration > 0) {
            videoDuration = parsedDuration;
            console.log(`Successfully extracted video duration: ${videoDuration} seconds`);
        } else {
             console.warn('FFprobe returned invalid duration value.');
        }
    } catch (error) {
        console.error(`Failed to extract video duration with ffprobe: ${error.message}`);
    }
    // --- End of duration calculation ---

    const hlsArgs = [
      '-i', inputPath,
      '-codec:', 'copy',
      '-start_number', '0',
      '-hls_time', '10',
      '-hls_list_size', '0',
      '-f', 'hls',
      hlsPath
    ];

    await runFFmpegCommand(hlsArgs);

    
    if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const thumbnailBuffer = await thumbnailFile.arrayBuffer();

      await sharp(Buffer.from(thumbnailBuffer))
        .webp({ quality: 80 })
        .toFile(thumbWebpPath);
        
    } else {
      // This block NO LONGER calculates duration. It uses the value from above.
      if (!videoDuration) {
          console.warn('Cannot generate random thumbnail because duration is unknown. Using 1s fallback.');
      }
      const minTime = Math.max(1, (videoDuration || 30) * 0.1);
      const maxTime = Math.max(minTime + 1, (videoDuration || 30) * 0.9);
      const randomTime = Math.random() * (maxTime - minTime) + minTime;

      const thumbArgs = [
        '-i', inputPath,
        '-ss', randomTime.toString(),
        '-vframes', '1',
        '-y',
        thumbPngPath
      ];

      try {
        await runFFmpegCommand(thumbArgs);
      } catch (error) {
        console.warn(`Thumbnail generation at ${randomTime}s failed, trying 1s: ${error.message}`);
        const fallbackThumbArgs = [
          '-i', inputPath,
          '-ss', '1',
          '-vframes', '1',
          '-y',
          thumbPngPath
        ];
        await runFFmpegCommand(fallbackThumbArgs);
      }

      try {
        await fs.access(thumbPngPath);
      } catch (e) {
        console.error("Thumbnail file was not created by ffmpeg.");
        throw new Error("Failed to generate video thumbnail.");
      }

      await sharp(thumbPngPath)
        .webp({ quality: 80 })
        .toFile(thumbWebpPath);

      await cleanupFile(thumbPngPath);
    }

    await cleanupFile(inputPath);

    const tags = tagsString && typeof tagsString === 'string' 
      ? tagsString.split(' ').map(tag => tag.trim()).filter(tag => tag.length > 0) 
      : [];

    const videoData = {
      title: title.trim(),
      description: description.trim(),
      slug: slug,
      videoUrl: `/stream/${slug}/video.m3u8`,
      thumbnail: `/stream/${slug}/thumb.webp`,
      duration: parsedClientDuration && !isNaN(parsedClientDuration) && parsedClientDuration > 0 
        ? Math.round(parsedClientDuration) 
        : (videoDuration && !isNaN(videoDuration) && videoDuration > 0 
          ? Math.round(videoDuration) 
          : -1),
      uploader: user._id,
      tags: tags,
      isProcessing: false
    };

    const newVideo = new Video(videoData);
    await newVideo.save();

    return c.json({
      success: true,
      message: 'Video uploaded and processed successfully!',
      video: newVideo.toObject(),
    }, 201);

  } catch (error) {
    console.error('Error in POST /uploadVideo route:', error);

    if (inputPath) await cleanupFile(inputPath);
    if (thumbPngPath) await cleanupFile(thumbPngPath);
    if (workDir) {
      try {
        const files = await fs.readdir(workDir);
        if (files.length === 0) {
          await fs.rmdir(workDir);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup work directory:', cleanupError.message);
      }
    }

    if (error.code === 11000) {
      return c.json({ success: false, message: 'This video content seems to have already been uploaded.' }, 409);
    }

    if (error.message.includes('FFmpeg')) {
      return c.json({ success: false, message: 'Video processing failed. Please ensure the video file is not corrupted.' }, 422);
    }

    if (error.code === 'ENOSPC') {
      return c.json({ success: false, message: 'Server storage is full. Please try again later.' }, 507);
    }

    if (error.code === 'EACCES') {
      return c.json({ success: false, message: 'Server permissions error. Please contact support.' }, 500);
    }

    return c.json({ success: false, message: 'An unexpected server error occurred during video processing.' }, 500);
  }
});

export default router;
