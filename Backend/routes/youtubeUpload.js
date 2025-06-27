import { Hono } from 'hono'
import fetch from 'node-fetch'
import config from '../../config.json' with { type: 'json' }
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import FormData from 'form-data'

const router = new Hono()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class AIDescriptionGenerator {
    constructor() {
        this.defaultModel = "gpt-4o";
        this.providers = ['Blackbox', 'PollinationsAI'];
    }

    async getResponse(model, providers, history) {
        const selectedModel = model || this.defaultModel;
        const selectedProviders = providers && providers.length > 0 ? providers : this.providers;

        return new Promise((resolve, reject) => {
            let completedProviders = 0;
            let hasResolved = false;

            const tryProvider = async (currentProvider) => {
                try {
                    const response = await fetch('https://chat-api-rp7a.onrender.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            model: selectedModel,
                            messages: history,
                            provider: currentProvider,
                            stream: false
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Provider ${currentProvider} failed`);
                    }

                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;

                    if (content && !hasResolved) {
                        hasResolved = true;
                        resolve(content);
                    } else {
                        throw new Error('No valid content from provider');
                    }

                } catch (error) {
                    console.error(`Error with ${currentProvider}:`, error);
                    completedProviders++;

                    if (completedProviders >= selectedProviders.length && !hasResolved) {
                        hasResolved = true;
                        reject(new Error('All AI providers failed'));
                    }
                }
            };

            selectedProviders.forEach(tryProvider);

            setTimeout(() => {
                if (!hasResolved) {
                    hasResolved = true;
                    reject(new Error('AI request timed out'));
                }
            }, 60000);
        });
    }
}

const downloadVideoToFile = async (url, quality) => {
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
    }

    const timestamp = Date.now()
    const tempFilePath = path.join(tempDir, `temp_video_${timestamp}.mp4`)

    try {
        const response = await fetch(`http://localhost:3002/api/youtube-downloader/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, quality }),
        });

        if (!response.ok) {
            // Check if response is JSON or HTML error page
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to download video');
            } else {
                // Response is likely an HTML error page
                const errorText = await response.text();
                console.error('Non-JSON error response:', errorText);
                throw new Error(`Download failed with status ${response.status}: ${response.statusText}`);
            }
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        if (buffer.length === 0) {
            throw new Error('Downloaded video file is empty');
        }
        
        fs.writeFileSync(tempFilePath, buffer);
        
        // Verify the file was written successfully
        if (!fs.existsSync(tempFilePath) || fs.statSync(tempFilePath).size === 0) {
            throw new Error('Failed to save video file');
        }

        return tempFilePath;
    } catch (error) {
        console.error('Error in downloadVideoToFile:', error);
        throw error;
    }
};

const downloadThumbnail = async (thumbnailUrl, title) => {
    if (!thumbnailUrl) {
        return null;
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const cleanTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const thumbnailPath = path.join(tempDir, `thumb_${cleanTitle}_${timestamp}.jpg`);

    try {
        const response = await fetch(thumbnailUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch thumbnail: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(thumbnailPath, buffer);

        return thumbnailPath;
    } catch (error) {
        console.error('Error downloading thumbnail:', error);
        return null;
    }
};

const uploadToLumeroo = async (tempVideoPath, title, description, token, thumbnailPath = null) => {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('title', title);
    formData.append('description', description);

    const videoStream = fs.createReadStream(tempVideoPath);
    // Sanitize filename more aggressively to prevent ByteString conversion errors
    const cleanTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const fileName = `${cleanTitle}.mp4`;
    formData.append('videoFile', videoStream, {
        filename: fileName,
        contentType: 'video/mp4'
    });

    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        const thumbnailStream = fs.createReadStream(thumbnailPath);
        const thumbnailFileName = `${cleanTitle}_thumb.jpg`;
        formData.append('thumbnailFile', thumbnailStream, {
            filename: thumbnailFileName,
            contentType: 'image/jpeg'
        });
    }

    const uploadResponse = await fetch(`${config.url}/api/uploadVideo`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
    });

    const uploadData = await uploadResponse.json();
    
    if (!uploadData.success) {
        throw new Error(uploadData.message || 'Upload to Lumeroo failed');
    }

    try {
        fs.unlinkSync(tempVideoPath);
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
        }
    } catch (error) {
        console.warn('Failed to cleanup temp files:', error.message);
    }

    return uploadData;
};

const getVideoInfo = async (url) => {
    const response = await fetch(`http://localhost:3002/api/youtube-downloader/init`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, includeDescription: true }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get video info');
    }

    const data = await response.json();
    if (!data.success || !data.videoInfo) {
        throw new Error('Failed to fetch video information');
    }

    return data.videoInfo;
};

const generateAIDescription = async (title, description) => {
    const aiGenerator = new AIDescriptionGenerator();
    
    try {
        const prompt = `Create a video description under 500 characters for this YouTube video. 
Title: "${title}"
Original Description: "${description || ''}"

The description should be engaging, descriptive, and suitable for a video platform. Do not include any links or URLs. There should be no markdown things in it and ONLY provide the description nothing else. Focus on describing what viewers can expect from the video. Make it concise and compelling. and keep it short`;

        const aiDescription = await aiGenerator.getResponse(
            "gpt-4o",
            ['Blackbox', 'PollinationsAI'],
            [{ role: "user", content: prompt }]
        );

        return aiDescription.length > 500 ? 
            aiDescription.substring(0, 497) + "..." : 
            aiDescription;

    } catch (error) {
        console.error('AI description generation failed:', error);
        return description && description.length > 500 
            ? description.substring(0, 497) + "..." 
            : description || "Uploaded from YouTube downloader";
    }
};

router.post('/', async (c) => {
    try {
        const formData = await c.req.formData();
        const url = formData.get('url');
        const quality = formData.get('quality');
        const token = formData.get('token');

        if (!url || !quality || !token) {
            return c.json({
                success: false,
                message: 'Missing required parameters: url, quality, and token are required'
            }, 400);
        }

        const videoInfo = await getVideoInfo(url);

        const tempVideoPath = await downloadVideoToFile(url, quality);

        const aiDescription = await generateAIDescription(videoInfo.title, videoInfo.description);
        const thumbnailPath = await downloadThumbnail(videoInfo.thumbnail, videoInfo.title);

        const uploadResult = await uploadToLumeroo(tempVideoPath, videoInfo.title, aiDescription, token, thumbnailPath);

        return c.json({
            success: true,
            message: 'Video uploaded to Lumeroo successfully!',
            video: uploadResult.video,
            aiDescription: aiDescription,
            thumbnailDownloaded: !!thumbnailPath
        });

    } catch (error) {
        console.error('YouTube upload error:', error);
        return c.json({
            success: false,
            message: error.message || 'Failed to process YouTube upload'
        }, 500);
    }
});

export default router