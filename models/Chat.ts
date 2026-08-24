import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId; // User ID
  senderRole: 'customer' | 'admin' | 'support' | 'sadmin';
  message: string;
  attachments?: string[];
  read: boolean;
  createdAt: Date;
}

export interface IChatSession extends Document {
  customer: mongoose.Types.ObjectId; // The user who initiated the chat
  assignedTo?: mongoose.Types.ObjectId; // The admin/support who claimed the chat
  status: 'active' | 'closed';
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  read: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for fetching messages by session quickly
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
// Index for finding unread messages
ChatMessageSchema.index({ sessionId: 1, read: 1 });

const ChatSessionSchema = new Schema<IChatSession>({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for chat dashboards
ChatSessionSchema.index({ status: 1 });
ChatSessionSchema.index({ customer: 1, status: 1 });
ChatSessionSchema.index({ lastMessageAt: -1 });

// Delete models if they exist to prevent HMR validation errors in Next.js development
if (mongoose.models.ChatMessage) {
  delete mongoose.models.ChatMessage;
}
if (mongoose.models.ChatSession) {
  delete mongoose.models.ChatSession;
}

export const ChatMessage: Model<IChatMessage> = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export const ChatSession: Model<IChatSession> = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);