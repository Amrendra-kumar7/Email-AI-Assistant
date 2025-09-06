import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const res = await gmail.users.messages.list({
      userId: "me",
      q: "subject:(Support OR Query OR Help OR Request)",
      maxResults: 5,
    });

    const emails = [];
    for (const msg of res.data.messages || []) {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
      });

      const headers = msgData.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";
      const body = msgData.data.snippet || "";

      emails.push({ from, subject, date, body });
    }

    return NextResponse.json({ emails });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
