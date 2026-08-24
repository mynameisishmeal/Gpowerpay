import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { ChatSession } from '@/models/Chat';

// POST /api/chat/init - Start or resume a chat session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check if the user already has an active chat session
    let chatSession = await ChatSession.findOne({ 
      customer: session.user.id, 
      status: 'active' 
    });

    // If not, create a new one
    if (!chatSession) {
      chatSession = new ChatSession({
        customer: session.user.id,
        status: 'active'
      });
      await chatSession.save();
    }

    return NextResponse.json({ success: true, sessionId: chatSession._id });
  } catch (error: any) {
    console.error('Chat init error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}