import { NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Please provide an email to test. Example: /api/test-fcm?email=your@email.com' 
      }, { status: 400 });
    }

    if (!adminMessaging) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Firebase Admin is NOT initialized. Check your .env.local FIREBASE_PRIVATE_KEY, etc.' 
      }, { status: 500 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select('fcmTokens').lean();

    if (!user) {
      return NextResponse.json({ status: 'error', message: `User with email ${email} not found.` }, { status: 404 });
    }

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return NextResponse.json({ 
        status: 'error', 
        message: `User ${email} has no FCM tokens. Please log into the app with this account and "Allow" notifications first.` 
      }, { status: 400 });
    }

    // Send a test notification to all their devices
    const response = await adminMessaging.sendEachForMulticast({
      notification: {
        title: '🔥 Firebase Test Success!',
        body: 'If you are seeing this on your screen, your Firebase setup is 100% working!',
      },
      tokens: user.fcmTokens as string[],
    });

    return NextResponse.json({
      status: 'success',
      message: 'Test notification fired!',
      firebaseConfig: 'Valid',
      devicesAttempted: user.fcmTokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
