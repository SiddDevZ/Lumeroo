import { Hono } from 'hono'
import YTDlpWrap from 'yt-dlp-wrap'
import fs from 'fs'
import path from 'path'
import ffmpeg from 'ffmpeg-static'
import { fileURLToPath } from 'url'

const router = new Hono()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ytdlp = new YTDlpWrap()

router.post('/init', async (c) => {
  try {
    const { url, includeDescription } = await c.req.json()
    
    if (!url) {
      return c.json({
        success: false,
        message: 'Invalid YouTube URL'
      }, 400)
    }

    const info = await ytdlp.getVideoInfo(url)
    const videoDetails = info

    const qualityOptions = []
    const qualityMap = new Map()

    info.formats.forEach(format => {
      const quality = format.format_note || format.resolution
      if (quality && format.vcodec !== 'none' && format.acodec !== 'none' && !qualityMap.has(quality)) {
        qualityMap.set(quality, {
          quality: quality,
          format: format.ext || 'mp4',
          size: format.filesize || format.filesize_approx ? `${Math.round((format.filesize || format.filesize_approx) / 1024 / 1024)} MB` : 'Unknown',
          fps: format.fps ? `${format.fps}fps` : '30fps',
          hasAudio: true,
          itag: format.format_id
        })
      }
    })

    info.formats.forEach(format => {
      const quality = format.format_note || format.resolution
      if (quality && format.vcodec !== 'none' && format.acodec === 'none' && !qualityMap.has(quality)) {
        qualityMap.set(quality, {
          quality: quality,
          format: format.ext || 'mp4',
          size: format.filesize || format.filesize_approx ? `${Math.round((format.filesize || format.filesize_approx) / 1024 / 1024)} MB` : 'Unknown',
          fps: format.fps ? `${format.fps}fps` : '30fps',
          hasAudio: false,
          itag: format.format_id
        })
      }
    })

    const qualityOrder = ['4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p']
    qualityOptions.push(...Array.from(qualityMap.values()).sort((a, b) => {
      const aIndex = qualityOrder.indexOf(a.quality)
      const bIndex = qualityOrder.indexOf(b.quality)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    }))

    const videoInfo = {
      id: videoDetails.id,
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
      duration: videoDetails.duration ? formatDuration(videoDetails.duration) : 'Unknown',
      views: formatViews(videoDetails.view_count),
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
    
    if (!url) {
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

    const info = await ytdlp.getVideoInfo(url)
    const title = info.title.replace(/[<>:"/\|?*]/g, '_')
    const outputFolder = path.join(__dirname, '../temp')
    const outputPath = path.join(outputFolder, `${title}_${quality}_${Date.now()}.mp4`)

    fs.mkdirSync(outputFolder, { recursive: true })

    const formats = info.formats
    let selectedVideoFormat = formats.find(f => (f.format_note === quality || f.resolution === quality) && f.vcodec !== 'none' && f.acodec !== 'none')
    
    if (!selectedVideoFormat) {
      const videoFormat = formats.find(f => (f.format_note === quality || f.resolution === quality) && f.vcodec !== 'none' && f.acodec === 'none')
      const audioFormats = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none').sort((a, b) => (b.abr || 0) - (a.abr || 0))
      const audioFormat = audioFormats[0]
      
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
  return ytdlp.exec([
    url,
    '-f', `${videoFormat.format_id}+${audioFormat.format_id}`,
    '--ffmpeg-location', ffmpeg,
    '-o', outputPath
  ])
}

function downloadDirect(url, format, outputPath) {
  return ytdlp.exec([
    url,
    '-f', format.format_id,
    '--ffmpeg-location', ffmpeg,
    '-o', outputPath
  ])
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