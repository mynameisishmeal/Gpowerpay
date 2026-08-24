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

    // Locking mechanism: if assigned to another admin, only that admin or a super admin can reply
    if (session.user.role !== 'customer' && session.user.role !== 'sadmin') {
      if (ticket.assignedTo && ticket.assignedTo.toString() !== session.user.id) {
        return NextResponse.json({ error: 'This ticket is already assigned to another staff member' }, { status: 403 });
      }
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

    // If an admin replies and it's unassigned, auto-assign
    if (session.user.role !== 'customer' && !ticket.assignedTo) {
      ticket.assignedTo = session.user.id;
    }

    await ticket.save();

    // Notifications
    const { NotificationService } = await import('@/lib/services/notificationService');
    const senderName = session.user.name || session.user.role;
    
    if (session.user.role === 'customer') {
      if (ticket.assignedTo) {
        // Notify assigned admin
        await NotificationService.notifyTicketReply(
          ticket.assignedTo.toString(),
          ticket.ticketId,
          ticket.subject,
          senderName
        );
      } else {
        // Notify all admins
        await NotificationService.notifyAdmins(
          'ticket_updated',
          `New reply on ticket ${ticket.ticketId}`,
          `${senderName} replied to: ${ticket.subject}`,
          { ticketId: ticket.ticketId }
        );
      }
    } else {
      // Admin replied, notify customer
      await NotificationService.notifyTicketReply(
        ticket.customer.toString(),
        ticket.ticketId,
        ticket.subject,
        senderName
      );
    }

    // Populate the newly added message sender for the response
    await ticket.populate('messages.sender', 'name email role');
    const newMessage = ticket.messages[ticket.messages.length - 1];

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('Add ticket message error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}