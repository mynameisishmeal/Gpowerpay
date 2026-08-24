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
    const { sessionId, message, attachments } = body;

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

    // Locking mechanism: if assigned to another admin, only that admin or a super admin can reply
    if (session.user.role !== 'customer' && session.user.role !== 'sadmin') {
      if (chatSession.assignedTo && chatSession.assignedTo.toString() !== session.user.id) {
        return NextResponse.json({ error: 'This chat is already assigned to another staff member' }, { status: 403 });
      }
    }

    const newMessage = new ChatMessage({
      sessionId: chatSession._id,
      senderId: session.user.id,
      senderRole: session.user.role,
      message,
      attachments: attachments || []
    });

    await newMessage.save();

    // Update lastMessageAt on the session
    chatSession.lastMessageAt = new Date();
    
    // If an admin replies, they are automatically assigned if unassigned
    if (session.user.role !== 'customer' && !chatSession.assignedTo) {
      chatSession.assignedTo = new mongoose.Types.ObjectId(session.user.id);
    }

    await chatSession.save();

    // Notifications
    const { NotificationService } = await import('@/lib/services/notificationService');
    const senderName = session.user.name || session.user.role;
    
    if (session.user.role === 'customer') {
      if (chatSession.assignedTo) {
        // Notify assigned admin
        await NotificationService.createNotification({
          userId: chatSession.assignedTo.toString(),
          type: 'new_message',
          title: `New reply from ${senderName}`,
          message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
          data: { sessionId }
        });
      } else {
        // Notify all admins
        await NotificationService.notifyAdmins(
          'new_message',
          `New Chat from ${senderName}`,
          message.length > 50 ? `${message.substring(0, 50)}...` : message,
          { sessionId }
        );
      }
    } else {
      // Admin replied, notify customer
      await NotificationService.notifyNewChatMessage(
        chatSession.customer.toString(),
        senderName,
        sessionId,
        message
      );
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}