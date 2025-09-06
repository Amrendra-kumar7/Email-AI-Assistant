import { NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail";
import { analyzeEmail } from "@/lib/ai";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const gmail = await getGmailClient();

    const response = await gmail.users.messages.get({
      userId: "me",
      id: params.id,
      format: "full",
    });

    const payload = response.data;

    // Extract body
    let body = "";
    const parts = payload.payload?.parts || [];
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf8");
      } else if (part.mimeType === "text/html" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf8");
      }
    }

    // Run AI analysis (summary + sentiment + urgency)
    const aiAnalysis = await analyzeEmail(body);

    return NextResponse.json({
      id: payload.id,
      threadId: payload.threadId,
      snippet: payload.snippet,
      subject: payload.payload?.headers?.find(h => h.name === "Subject")?.value,
      from: payload.payload?.headers?.find(h => h.name === "From")?.value,
      date: payload.payload?.headers?.find(h => h.name === "Date")?.value,
      body,
      ai: aiAnalysis
    });
  } catch (error: any) {
    console.error("Gmail API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
