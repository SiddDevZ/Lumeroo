import { Hono } from 'hono'
import fetch from 'node-fetch'
import config from '../../config.json' assert { type: 'json' }
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

    const response = await fetch(`http://localhost:3002/api/youtube-downloader/download`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, quality }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download video');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(tempFilePath, buffer);

    return tempFilePath;
};

const uploadToLumeroo = async (tempVideoPath, title, description, token) => {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('title', title);
    formData.append('description', description);

    const videoStream = fs.createReadStream(tempVideoPath);
    const fileName = `${title.replace(/[<>:"/\\|?*]/g, '_')}.mp4`;
    formData.append('videoFile', videoStream, {
        filename: fileName,
        contentType: 'video/mp4'
    });

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
    } catch (error) {
        console.warn('Failed to cleanup temp file:', error.message);
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

The description should be engaging, descriptive, and suitable for a video platform. Do not include any links or URLs. Focus on describing what viewers can expect from the video. Make it concise and compelling. and keep it short`;

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
        // console.log('AI Description generated:', aiDescription);

        const uploadResult = await uploadToLumeroo(tempVideoPath, videoInfo.title, aiDescription, token);

        return c.json({
            success: true,
            message: 'Video uploaded to Lumeroo successfully!',
            video: uploadResult.video,
            aiDescription: aiDescription
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