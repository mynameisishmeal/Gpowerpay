import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

// POST /api/tickets/[id]/messages - Add a message to a ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, attachments } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    await dbConnect();
    const { id } = params;

    const ticket = await Ticket.findOne({ ticketId: id });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Ensure customer can only reply to their own ticket
    if (session.user.role === 'customer' && ticket.customer.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If a customer replies to a closed or resolved ticket, we might want to re-open it
    if (session.user.role === 'customer' && ['resolved', 'closed'].includes(ticket.status)) {
      ticket.status = 'open';
    }

    // Add the new message
    ticket.messages.push({
      sender: session.user.id,
      message,
      attachments: attachments || []
    });

    await ticket.save();

    // Populate the newly added message sender for the response
    await ticket.populate('messages.sender', 'name email role');
    const newMessage = ticket.messages[ticket.messages.length - 1];

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('Add ticket message error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}