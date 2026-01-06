
// YouTube Transcription Service - "Pro" Version
// Uses Internal Serverless API + AssemblyAI for high-quality transcription

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export interface TranscriptSegment {
    text: string;
    start: number;
    end: number;
}

export const youtubeService = {
    /**
     * Extract video ID from a YouTube URL
     */
    extractVideoId(url: string): string | null {
        const match = url.match(YOUTUBE_REGEX);
        return match ? match[1] : null;
    },

    /**
     * Check if a string contains a YouTube URL
     */
    isYouTubeUrl(text: string): boolean {
        return YOUTUBE_REGEX.test(text);
    },

    /**
     * Get transcript using prioritized internal API then AssemblyAI
     */
    async getTranscript(videoUrl: string): Promise<string> {
        const videoId = this.extractVideoId(videoUrl);
        if (!videoId) throw new Error('Invalid YouTube URL');

        const errors: string[] = [];

        // Method 1: Internal Serverless API (Most robust against school blocks)
        try {
            const transcript = await this.fetchFromInternalAPI(videoId);
            if (transcript) return transcript;
        } catch (e: any) {
            errors.push(`Internal API: ${e.message}`);
        }

        // Method 2: AssemblyAI "Pro" flow (Best for videos without captions)
        const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
        if (apiKey) {
            try {
                const audioUrl = await this.resolveAudioUrl(videoId);
                if (audioUrl) {
                    const transcriptId = await this.submitToAssemblyAI(audioUrl, apiKey);
                    const text = await this.pollAssemblyAI(transcriptId, apiKey);
                    if (text) return text;
                }
            } catch (e: any) {
                errors.push(`AssemblyAI: ${e.message}`);
            }
        }

        // Method 3: Direct Proxy Fallback
        try {
            const transcript = await this.fallbackToProxy(videoId);
            if (transcript) return transcript;
        } catch (e: any) {
            errors.push(`Proxy: ${e.message}`);
        }

        throw new Error(`All transcription methods failed. Errors: ${errors.join(' | ')}`);
    },

    async fetchFromInternalAPI(videoId: string): Promise<string | null> {
        // This calls our own Vercel function, bypassing school filters
        const response = await fetch(`/api/transcript?videoId=${videoId}`);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Server error ${response.status}`);
        }
        const data = await response.json();
        return data.transcript || null;
    },

    async resolveAudioUrl(videoId: string): Promise<string | null> {
        try {
            const response = await fetch(`https://api.cobalt.tools/api/json`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    isAudioOnly: true
                })
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.url || null;
        } catch {
            return null;
        }
    },

    async submitToAssemblyAI(audioUrl: string, apiKey: string): Promise<string> {
        const response = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: audioUrl
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'AssemblyAI submission failed');
        }

        const data = await response.json();
        return data.id;
    },

    async pollAssemblyAI(transcriptId: string, apiKey: string): Promise<string> {
        const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

        while (true) {
            const response = await fetch(pollingEndpoint, {
                headers: { 'Authorization': apiKey }
            });

            if (!response.ok) throw new Error('Polling failed');
            const data = await response.json();

            if (data.status === 'completed') {
                return data.text;
            } else if (data.status === 'error') {
                throw new Error(data.error);
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    },

    async fallbackToProxy(videoId: string): Promise<string> {
        const response = await fetch(`https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}&lang=en`);
        if (!response.ok) throw new Error('Public proxy failed');

        const data = await response.json();
        if (Array.isArray(data)) {
            return data.map((seg: any) => seg.text).join(' ');
        }
        throw new Error('Malformed proxy data');
    }
};

export default youtubeService;
