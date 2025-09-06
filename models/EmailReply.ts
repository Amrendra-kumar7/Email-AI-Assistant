// models/EmailReply.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailReply extends Document {
  emailId: string;
  originalContent: string;
  insights: {
    summary: string;
    sentiment: string;
    urgency: string;
  };
  aiReply: string;
  sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailReplySchema: Schema = new Schema({
  emailId: { type: String, required: true },
  originalContent: { type: String, required: true },
  insights: {
    summary: String,
    sentiment: String,
    urgency: String
  },
  aiReply: { type: String, required: true },
  sent: { type: Boolean, default: false },
}, {
  timestamps: true
});

export default mongoose.models.EmailReply || mongoose.model<IEmailReply>('EmailReply', EmailReplySchema);