import { NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    // Load saved token
    const token = JSON.parse(fs.readFileSync("token.json", "utf8"));

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials(token);

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Fetch full email
    const res = await gmail.users.messages.get({
      userId: "me",
      id: params.id,
      format: "full",
    });

    const payload = res.data.payload;
    const headers = payload?.headers || [];

    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const from = headers.find((h) => h.name === "From")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";

    // --- Extract email body ---
    function decodeBase64(str: string) {
      return Buffer.from(str, "base64").toString("utf-8");
    }

    let body = "";

    if (payload?.parts) {
      // Prefer HTML, fallback to plain text
      const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
      const textPart = payload.parts.find((p) => p.mimeType === "text/plain");

      if (htmlPart?.body?.data) {
        body = decodeBase64(htmlPart.body.data);
      } else if (textPart?.body?.data) {
        body = decodeBase64(textPart.body.data);
      }
    } else if (payload?.body?.data) {
      body = decodeBase64(payload.body.data);
    }

    return NextResponse.json({
      id: params.id,
      subject,
      from,
      date,
      body,
    });
  } catch (error) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}
