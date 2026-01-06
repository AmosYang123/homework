import type { VercelRequest, VercelResponse } from '@vercel/node';
import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid videoId parameter' });
    }

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        const fullText = transcript.map(item => item.text).join(' ');

        return res.status(200).json({
            transcript: fullText,
            raw: transcript
        });
    } catch (error: any) {
        console.error('Transcript API Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch transcript on server',
            details: error.message || String(error)
        });
    }
}
