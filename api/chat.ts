import OpenAI from 'openai';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Get API Key from Environment
    // Vercel exposes environment variables on process.env
    const apiKey = process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server Configuration Error: Missing VITE_GROQ_API_KEY' });
    }

    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.groq.com/openai/v1",
    });

    try {
        const { messages, model, temperature, max_tokens } = req.body;

        const completion = await client.chat.completions.create({
            model: model || 'llama-3.1-70b-versatile',
            messages: messages,
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 8192,
        });

        return res.status(200).json(completion);
    } catch (error: any) {
        console.error('Groq Proxy Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: error.response?.data || error.toString()
        });
    }
}
