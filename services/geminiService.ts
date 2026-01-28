
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export interface GeminiResult {
  text: string;
  groundingChunks?: any[];
  isError?: boolean;
}

export const getGeminiResponse = async (prompt: string, context?: string, useSearch: boolean = false): Promise<GeminiResult> => {
  // Fixed: Always use a named parameter and obtain the API key directly from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fullPrompt = context 
    ? `Контекст проекта: ${context}\n\nЗадача: ${prompt}`
    : prompt;

  try {
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config,
    });

    const candidate = response.candidates?.[0];
    // Fixed: Accessing the .text property directly instead of a method or nested property
    const text = response.text || "Извините, не удалось сгенерировать ответ.";
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks;

    return { text, groundingChunks, isError: false };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "Ошибка: Не удалось получить ответ от ИИ. Проверьте API ключ или интернет-соединение.", 
      isError: true 
    };
  }
};
