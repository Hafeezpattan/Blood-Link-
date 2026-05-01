import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getEncouragementMessage(role: 'donor' | 'recipient') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: role === 'donor' 
        ? "Give a short (one sentence) inspiring quote about how donating blood saves lives." 
        : "Give a short (one sentence) comforting message for someone waiting for a blood donor.",
      config: {
        systemInstruction: "You are a highly empathetic coordinator at a blood donation center. Keep it professional, warm, and concise."
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return role === 'donor' ? "Every donor is a hero." : "Help is on the way.";
  }
}
