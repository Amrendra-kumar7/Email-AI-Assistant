// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: SCOPES,
          access_type: "offline", // ensures refresh_token is returned
          prompt: "consent",      // forces consent screen to always return refresh_token
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in
      if (account) {
        token.accessToken = account.access_token;

        // Handle expiration correctly
        const expiresIn = account.expires_in ? account.expires_in * 1000 : 3600 * 1000;
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000 // account.expires_at is usually in seconds
          : Date.now() + expiresIn;

        // Persist refresh token (only provided on first consent)
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
      }

      // If access token is still valid, return it
      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // Otherwise, refresh the access token
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        const refreshed = await res.json();

        if (!res.ok) throw refreshed;

        token.accessToken = refreshed.access_token;
        token.expiresAt = Date.now() + refreshed.expires_in * 1000;

        return token;
      } catch (err) {
        console.error("Failed to refresh Google access token:", err);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
