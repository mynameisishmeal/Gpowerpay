import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { ChatSession, ChatMessage } from '@/models/Chat';
import mongoose from 'mongoose';

// POST /api/chat/send - Send a chat message
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, message } = body;

    if (!sessionId || !message || message.trim() === '') {
      return NextResponse.json({ error: 'Session ID and message are required' }, { status: 400 });
    }

    await dbConnect();
    
    const chatSession = await ChatSession.findById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Security check: if sender is customer, they must own the session
    if (session.user.role === 'customer' && chatSession.customer.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = new ChatMessage({
      sessionId: chatSession._id,
      senderId: session.user.id,
      senderRole: session.user.role,
      message
    });

    await newMessage.save();

    // Update lastMessageAt on the session
    chatSession.lastMessageAt = new Date();
    
    // If an admin replies, they are automatically assigned
    if (session.user.role !== 'customer' && !chatSession.assignedTo) {
      chatSession.assignedTo = new mongoose.Types.ObjectId(session.user.id);
    }

    await chatSession.save();

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}