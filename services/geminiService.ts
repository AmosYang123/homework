
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { StyleTemplate, Message, FileAttachment } from "../types";

export class GeminiService {
  async generateResponse(
    userInput: string,
    history: Message[],
    activeTemplate?: StyleTemplate,
    attachments: FileAttachment[] = [],
    modelName: string = 'gemini-3-flash-preview',
    thinkingBudget: number = 0
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepare conversation context
    const recentHistory = history.slice(-10);
    const historyParts = recentHistory.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

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

    const currentParts: any[] = [{ text: finalPrompt }];
    
    // Handle file attachments
    for (const file of attachments) {
      const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
      currentParts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      });
    }

    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4,
    };

    if (thinkingBudget > 0 && (modelName.includes('pro') || modelName.includes('3'))) {
      config.thinkingConfig = { thinkingBudget };
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...historyParts as any,
          { role: 'user', parts: currentParts }
        ],
        config: config
      });

      return response.text || "I was unable to generate a response. Please try a different prompt.";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error.message?.includes("API key")) {
        return "Authentication error: Please ensure your API key is valid.";
      }
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
