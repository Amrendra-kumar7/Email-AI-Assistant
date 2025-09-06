import { NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail";

function getBody(payload: any): string {
  let body = "";

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
        break; // prefer HTML
      } else if (part.mimeType === "text/plain" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
  } else if (payload.body?.data) {
    // Single-part message
    body = Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  return body;
}

export async function GET() {
  try {
    const gmail = await getGmailClient();

    // Step 1: List messages
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5, // fetch 5 emails
    });

    const messages = listRes.data.messages || [];

    // Step 2: Fetch full details
    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const msgRes = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full", // ✅ fetch entire email
        });

        const headers = msgRes.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value;
        const from = headers.find((h) => h.name === "From")?.value;
        const date = headers.find((h) => h.name === "Date")?.value;

        // Extract body
        const body = getBody(msgRes.data.payload);

        return {
          id: msg.id,
          subject,
          from,
          date,
          snippet: msgRes.data.snippet,
          body, // ✅ full email content
        };
      })
    );

    return NextResponse.json(detailedMessages);
  } catch (error: any) {
    console.error("Gmail API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
