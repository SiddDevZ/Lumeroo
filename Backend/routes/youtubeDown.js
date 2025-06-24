import { Hono } from 'hono'
import ytdl from '@distube/ytdl-core'
import fs from 'fs'
import path from 'path'
import { PassThrough } from 'stream'
import cp from 'child_process'
import ffmpeg from 'ffmpeg-static'
import { fileURLToPath } from 'url'

const router = new Hono()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

router.post('/init', async (c) => {
  try {
    const { url, includeDescription } = await c.req.json()
    
    if (!url || !ytdl.validateURL(url)) {
      return c.json({
        success: false,
        message: 'Invalid YouTube URL'
      }, 400)
    }

    const info = await ytdl.getInfo(url)
    const videoDetails = info.videoDetails

    const formats = ytdl.filterFormats(info.formats, 'videoandaudio')
    const videoOnlyFormats = ytdl.filterFormats(info.formats, 'videoonly')
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')

    const qualityOptions = []
    const qualityMap = new Map()

    formats.forEach(format => {
      if (format.qualityLabel && !qualityMap.has(format.qualityLabel)) {
        qualityMap.set(format.qualityLabel, {
          quality: format.qualityLabel,
          format: 'mp4',
          size: format.contentLength ? `${Math.round(format.contentLength / 1024 / 1024)} MB` : 'Unknown',
          fps: format.fps ? `${format.fps}fps` : '30fps',
          hasAudio: true,
          itag: format.itag
        })
      }
    })

    if (audioFormats.length > 0) {
      videoOnlyFormats.forEach(format => {
        if (format.qualityLabel && !qualityMap.has(format.qualityLabel)) {
          qualityMap.set(format.qualityLabel, {
            quality: format.qualityLabel,
            format: 'mp4',
            size: format.contentLength ? `${Math.round(format.contentLength / 1024 / 1024)} MB` : 'Unknown',
            fps: format.fps ? `${format.fps}fps` : '30fps',
            hasAudio: false,
            itag: format.itag
          })
        }
      })
    }

    const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p']
    qualityOptions.push(...Array.from(qualityMap.values()).sort((a, b) => {
      const aIndex = qualityOrder.indexOf(a.quality)
      const bIndex = qualityOrder.indexOf(b.quality)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    }))

    const videoInfo = {
      id: videoDetails.videoId,
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
      duration: videoDetails.lengthSeconds ? formatDuration(videoDetails.lengthSeconds) : 'Unknown',
      views: formatViews(videoDetails.viewCount),
      qualities: qualityOptions
    }
    if (includeDescription) {
      videoInfo.description = videoDetails.description || ''
    }

    return c.json({
      success: true,
      videoInfo
    })

  } catch (error) {
    console.error('Error fetching video info:', error)
    return c.json({
      success: false,
      message: 'Failed to fetch video information'
    }, 500)
  }
})

router.post('/download', async (c) => {
  try {
    const { url, quality } = await c.req.json()
    
    if (!url || !ytdl.validateURL(url)) {
      return c.json({
        success: false,
        message: 'Invalid YouTube URL'
      }, 400)
    }

    if (!quality) {
      return c.json({
        success: false,
        message: 'Quality parameter is required'
      }, 400)
    }

    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title.replace(/[<>:"/\\|?*]/g, '_')
    const outputFolder = path.join(__dirname, '../temp')
    const outputPath = path.join(outputFolder, `${title}_${quality}_${Date.now()}.mp4`)

    fs.mkdirSync(outputFolder, { recursive: true })

    const formats = info.formats
    let selectedVideoFormat = formats.find(f => f.qualityLabel === quality && f.hasVideo && f.hasAudio)
    
    if (!selectedVideoFormat) {
      const videoFormat = formats.find(f => f.qualityLabel === quality && f.hasVideo && !f.hasAudio)
      const audioFormat = ytdl.chooseFormat(formats, { quality: 'highestaudio', filter: 'audioonly' })
      
      if (!videoFormat || !audioFormat) {
        return c.json({
          success: false,
          message: 'Requested quality not available'
        }, 400)
      }

      await downloadAndMerge(url, videoFormat, audioFormat, outputPath)
    } else {
      await downloadDirect(url, selectedVideoFormat, outputPath)
    }

    if (!fs.existsSync(outputPath)) {
      return c.json({
        success: false,
        message: 'Failed to process video'
      }, 500)
    }

    const fileBuffer = fs.readFileSync(outputPath)
    const fileName = `${title}_${quality}.mp4`

    setTimeout(() => {
      try {
        fs.unlinkSync(outputPath)
      } catch (err) {
        console.error('Error deleting temp file:', err)
      }
    }, 1000)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error downloading video:', error)
    return c.json({
      success: false,
      message: 'Failed to download video'
    }, 500)
  }
})

function downloadAndMerge(url, videoFormat, audioFormat, outputPath) {
  return new Promise((resolve, reject) => {
    const videoStream = new PassThrough()
    const audioStream = new PassThrough()

    ytdl(url, { format: videoFormat }).pipe(videoStream)
    ytdl(url, { format: audioFormat }).pipe(audioStream)

    const ff = cp.spawn(ffmpeg, [
      '-loglevel', 'error',
      '-y',
      '-i', 'pipe:3',
      '-i', 'pipe:4',
      '-map', '0:v?',
      '-map', '1:a?',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-shortest',
      outputPath
    ], {
      stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe']
    })

    videoStream.pipe(ff.stdio[3])
    audioStream.pipe(ff.stdio[4])

    ff.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`))
      }
    })

    ff.on('error', (err) => {
      reject(err)
    })
  })
}

function downloadDirect(url, format, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, { format: format })
    const writeStream = fs.createWriteStream(outputPath)
    
    stream.pipe(writeStream)
    
    writeStream.on('finish', () => {
      resolve()
    })
    
    writeStream.on('error', (err) => {
      reject(err)
    })
    
    stream.on('error', (err) => {
      reject(err)
    })
  })
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatViews(viewCount) {
  if (!viewCount) return 'Unknown'
  
  const count = parseInt(viewCount)
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(1)}B`
  } else if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

export default router