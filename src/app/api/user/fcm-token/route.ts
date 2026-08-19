import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await connectDB();

    // Add token if it doesn't already exist
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { fcmTokens: token }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 }
    );
  }
}
