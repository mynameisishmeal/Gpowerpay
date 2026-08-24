import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import mongoose from 'mongoose';

// POST /api/tickets - Create a new ticket
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subject, description, priority, relatedOrder } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    await dbConnect();

    const ticketData: any = {
      customer: session.user.id,
      subject,
      description,
      priority: priority || 'medium',
      messages: [{
        sender: session.user.id,
        message: description
      }]
    };

    if (relatedOrder && mongoose.Types.ObjectId.isValid(relatedOrder)) {
      ticketData.relatedOrder = relatedOrder;
    }

    const ticket = new Ticket(ticketData);
    await ticket.save();

    // Notify admins
    const { NotificationService } = await import('@/lib/services/notificationService');
    const senderName = session.user.name || 'Customer';
    await NotificationService.notifyNewTicket(
      ticket.ticketId,
      subject,
      senderName
    );

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error: any) {
    console.error('Ticket creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET /api/tickets - List tickets
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const skip = (page - 1) * limit;

    // Build query based on user role
    const query: any = {};
    
    // Customers can only see their own tickets
    // Admins and Support can see all tickets, or filter by customerId
    const role = session.user.role;
    if (role === 'customer') {
      query.customer = session.user.id;
    } else {
      const customerId = url.searchParams.get('customerId');
      if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
        query.customer = customerId;
      }
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    const total = await Ticket.countDocuments(query);

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}