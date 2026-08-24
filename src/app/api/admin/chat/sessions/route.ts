import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { ChatSession } from '@/models/Chat';
import User from '@/models/User';

// GET /api/admin/chat/sessions - List chat sessions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role === 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'active';

    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }

    const sessions = await ChatSession.find(query)
      .sort({ lastMessageAt: -1 })
      .populate({ path: 'customer', model: User, select: 'name email phone' })
      .populate({ path: 'assignedTo', model: User, select: 'name' })
      .lean();

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Fetch chat sessions error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/chat/sessions - Close a session or assign
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role === 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, status, assignedTo } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const chatSession = await ChatSession.findById(sessionId);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    if (status) chatSession.status = status;
    if (assignedTo !== undefined) chatSession.assignedTo = assignedTo;

    await chatSession.save();

    return NextResponse.json({ success: true, session: chatSession });
  } catch (error: any) {
    console.error('Update chat session error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}