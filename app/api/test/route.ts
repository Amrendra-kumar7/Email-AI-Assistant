import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  // Check MongoDB connection
  let mongoStatus = "❌ Not connected";
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB,
      });
      mongoStatus = "✅ Connected to MongoDB";
    }
  } catch (error) {
    mongoStatus = `❌ MongoDB error: ${error}`;
  }

  return NextResponse.json({
    mongo: mongoStatus,
    hf: process.env.HF_API_KEY ? "✅ HuggingFace Key Loaded" : "❌ Missing",
    gemini: process.env.GEMINI_API_KEY ? "✅ Gemini Key Loaded" : "❌ Missing",
  });
}
