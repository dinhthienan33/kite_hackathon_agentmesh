import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with the API key injected by Vite
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
  console.warn("GEMINI_API_KEY is missing or invalid. Please configure it in the Secrets panel.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const getModel = (modelName: string = "gemini-3-flash-preview") => {
  return ai.models.generateContent.bind(ai.models);
};
