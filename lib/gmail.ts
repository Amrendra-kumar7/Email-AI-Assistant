import fs from "fs";
import { google } from "googleapis";

const TOKEN_PATH = "token.json";

export async function getGmailClient() {
  // Load saved token
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000" // same redirect URI
  );

  oAuth2Client.setCredentials(token);

  return google.gmail({ version: "v1", auth: oAuth2Client });
}
