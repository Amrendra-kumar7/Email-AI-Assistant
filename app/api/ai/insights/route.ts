// app/api/ai/insights/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { subject, body } = await req.json();

    if (!body) {
      return NextResponse.json(
        { error: "Email body is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prompt Gemini
    const prompt = `
You are an AI email assistant. Analyze the following email and provide:
1. A concise summary (2–3 sentences).
2. The sentiment (Positive, Negative, Neutral).
3. The urgency (High, Medium, Low).

Email Subject: ${subject}
Email Body: ${body}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Basic parsing (we expect Gemini to output structured text)
    // Example response format:
    // Summary: ...
    // Sentiment: ...
    // Urgency: ...
    const summaryMatch = text.match(/Summary:\s*(.*)/i);
    const sentimentMatch = text.match(/Sentiment:\s*(.*)/i);
    const urgencyMatch = text.match(/Urgency:\s*(.*)/i);

    return NextResponse.json({
      summary: summaryMatch ? summaryMatch[1].trim() : "No summary available",
      sentiment: sentimentMatch ? sentimentMatch[1].trim() : "Unknown",
      urgency: urgencyMatch ? urgencyMatch[1].trim() : "Unknown",
    });
  } catch (err) {
    console.error("AI Insights error:", err);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
