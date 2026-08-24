import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { ChatSession, ChatMessage } from '@/models/Chat';
import User from '@/models/User'; // Need User model for population

// GET /api/chat/sync?sessionId=123&lastMessageId=456
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    const lastMessageId = url.searchParams.get('lastMessageId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const chatSession = await ChatSession.findById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Security check
    if (session.user.role === 'customer' && chatSession.customer.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const query: any = { sessionId: chatSession._id };
    
    // If we have a lastMessageId, we only want messages newer than it
    if (lastMessageId) {
      // Find the last message to get its timestamp
      const lastMessage = await ChatMessage.findById(lastMessageId);
      if (lastMessage) {
        query.createdAt = { $gt: lastMessage.createdAt };
      }
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 }) // Chronological order
      .populate({ path: 'senderId', model: User, select: 'name email' })
      .lean();

    // Mark messages as read if they were sent by the other party
    const unreadMessageIds = messages
      .filter(m => !m.read && m.senderRole !== session.user.role)
      .map(m => m._id);

    if (unreadMessageIds.length > 0) {
      await ChatMessage.updateMany(
        { _id: { $in: unreadMessageIds } },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Chat sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}