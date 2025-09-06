// app/api/ai/reply/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { emailId, emailContent, insights } = await req.json();

    if (!emailId || !emailContent) {
      return NextResponse.json(
        { error: "emailId and emailContent are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an assistant writing a professional email reply.

    Email content:
    ${emailContent}

    AI Insights:
    ${JSON.stringify(insights)}

    Write a polite, clear, and professional reply:
    `;

    const result = await model.generateContent(prompt);
    const replyText = result.response.text().trim();

    // Save reply in DB
    const savedReply = await prisma.reply.create({
      data: {
        emailId,
        reply: replyText,
        insights,
      },
    });

    return NextResponse.json({ reply: replyText, saved: savedReply });
  } catch (error) {
    console.error("AI Reply Error:", error);
    return NextResponse.json(
      { error: "Failed to generate/save reply" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const replies = await prisma.reply.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
