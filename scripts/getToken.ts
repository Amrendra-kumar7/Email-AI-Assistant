// scripts/getToken.ts
import fs from "fs";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // Load env vars

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

async function main() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    "http://localhost:3000" // must match Google Console Redirect URI
  );

  // --- STEP 1: generate auth URL if no code provided ---
  const codeFromEnv = process.env.GOOGLE_AUTH_CODE; // 👈 We’ll use env var
  if (!codeFromEnv) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("\n👉 Authorize this app by visiting this url:\n", authUrl);
    console.log(
      "\n⚠️ After signing in, copy the ?code=XXXX from the redirect URL and run again with:\n"
    );
    console.log(
      "   GOOGLE_AUTH_CODE=XXXX npx tsx scripts/getToken.ts\n"
    );
    return;
  }

  // --- STEP 2: use the code to fetch token ---
  const { tokens } = await oAuth2Client.getToken(codeFromEnv);
  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync("token.json", JSON.stringify(tokens, null, 2));
  console.log("✅ Token saved to token.json");
}

main().catch(console.error);
