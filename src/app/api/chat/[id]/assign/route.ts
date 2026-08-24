import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { ChatSession } from '@/models/Chat';
import User from '@/models/User';

// PUT /api/chat/[id]/assign
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== 'admin' && session.user.role !== 'sadmin')) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can reassign chats.' }, { status: 403 });
    }

    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    await dbConnect();
    const { id } = params;

    const chatSession = await ChatSession.findById(id);
    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Only sadmins or the currently assigned admin can reassign it
    if (session.user.role !== 'sadmin' && chatSession.assignedTo && chatSession.assignedTo.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden. Only Super Admins or the assigned admin can reassign.' }, { status: 403 });
    }

    // Verify the new admin exists and is an admin
    const newAdmin = await User.findById(adminId);
    if (!newAdmin || !['admin', 'sadmin', 'support'].includes(newAdmin.role)) {
      return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
    }

    chatSession.assignedTo = adminId;
    await chatSession.save();

    return NextResponse.json({ success: true, message: 'Chat reassigned successfully' });
  } catch (error: any) {
    console.error('Chat assign error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
