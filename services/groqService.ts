
import OpenAI from "openai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { StyleTemplate, Message, FileAttachment } from "../types";

export class GroqService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
            baseURL: "https://api.groq.com/openai/v1",
            dangerouslyAllowBrowser: true
        });
        const key = import.meta.env.VITE_GROQ_API_KEY || "";
        console.log("Groq Service Initialized. Key length:", key.length, "Key starts with:", key.substring(0, 8) + "...");
    }

    async generateResponse(
        userInput: string,
        history: Message[],
        activeTemplate?: StyleTemplate,
        attachments: FileAttachment[] = [],
        modelName: string = 'llama-3.1-70b-versatile',
        thinkingBudget: number = 0
    ): Promise<string> {

        const messages: any[] = [
            { role: "system", content: SYSTEM_INSTRUCTION }
        ];

        for (const m of history.slice(-10)) {
            messages.push({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            });
        }

        let finalPrompt = userInput;

        if (activeTemplate) {
            finalPrompt = `
[STYLE TEMPLATE: @${activeTemplate.name}]
LEARNING PATTERN:
Input Example: """${activeTemplate.inputExample}"""
Output Example: """${activeTemplate.outputExample}"""

NEW INPUT TO TRANSFORM:
"""${userInput}"""

TASK: Apply the learned transformation logic f(x)=y to the NEW INPUT. Output ONLY the result. DO NOT USE EMOJIS.
`;
        }

        if (attachments.length > 0) {
            finalPrompt += "\n\n[USER ATTACHED FILES: " + attachments.map(a => a.name).join(", ") + "]";
        }

        messages.push({ role: "user", content: finalPrompt });

        if (!this.client.apiKey && import.meta.env.DEV) {
            return "Configuration Error: Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env.local file.";
        }

        // Use Proxy in Production to bypass network restrictions (e.g. School WiFi)
        if (!import.meta.env.DEV) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: messages,
                        model: modelName,
                        temperature: 0.7,
                        max_tokens: 8192
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Proxy Error: ${response.status} ${response.statusText}`);
                }

                const completion = await response.json();
                return completion.choices[0].message.content || "I was unable to generate a response.";
            } catch (error: any) {
                console.error("Proxy Request Failed:", error);
                return `Connection Error: Failed to reach AI service via Server Proxy. Details: ${error.message}`;
            }
        }

        try {
            const completion = await this.client.chat.completions.create({
                model: modelName,
                messages: messages,
                temperature: 0.7,
                max_tokens: 8192,
                stream: false
            });

            const choice = completion.choices[0];
            return choice.message.content || "I was unable to generate a response.";
        } catch (error: any) {
            console.error("Groq API Error:", error);

            if (error.message?.includes("401")) {
                return "Authentication Error: The provided Groq API key is invalid (401). Please check your .env.local file.";
            }

            if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
                return "Network Error: Unable to connect to Groq API. Your school network might be blocking 'api.groq.com'. Try using a mobile hotspot or VPN if allowed.";
            }

            return `Error: ${error.message || "An unexpected error occurred while contacting the AI service."}`;
        }

    }

    async generateTitle(userInput: string): Promise<string> {
        if (!this.client.apiKey) {
            console.warn("Groq API Key missing, skipping title generation.");
            return "New Chat";
        }

        try {
            const completion = await this.client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: "You are a helpful assistant. Generate a short, concise title (max 4-5 words) for the following user message. Do not use quotes. output ONLY the title text." },
                    { role: "user", content: userInput }
                ],
                temperature: 0.5,
                max_tokens: 20,
            });
            return completion.choices[0].message.content?.trim().replace(/^["']|["']$/g, '') || "New Chat";
        } catch (error: any) {
            console.error("Title generation failed:", error.message);
            return "New Chat";
        }

    }
}

export const groqService = new GroqService();
