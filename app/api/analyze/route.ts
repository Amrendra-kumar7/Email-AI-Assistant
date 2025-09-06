import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { emailText } = await req.json();

  // Hugging Face sentiment
  const hfResp = await fetch("https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: emailText }),
  });

  const sentiment = await hfResp.json();

  // Gemini reply generation (example placeholder)
  const geminiReply = `Draft reply for: ${emailText}`;

  return NextResponse.json({ sentiment, geminiReply });
}
