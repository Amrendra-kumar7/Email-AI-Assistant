// lib/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function analyzeEmail(body: string) {
  const prompt = `
  You are an AI assistant analyzing Gmail messages.

  1. Summarize this email in 2-3 sentences.
  2. Detect the sentiment as one of: Positive, Neutral, or Negative.
  3. If it's a request or complaint, identify urgency (High/Medium/Low).

  Return response in JSON format like:
  {
    "summary": "...",
    "sentiment": "Positive | Neutral | Negative",
    "urgency": "High | Medium | Low"
  }

  Email:
  ${body}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    // Fallback if Gemini returns markdown/json with formatting
    return {
      summary: text,
      sentiment: "Unknown",
      urgency: "Medium"
    };
  }
}
