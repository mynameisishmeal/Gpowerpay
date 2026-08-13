import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        socials: [],
        phoneNumbers: [],
        emails: [],
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is super admin
    if (!session?.user || session.user.role !== 'sadmin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only super admins can update settings.' },
        { status: 401 }
      );
    }

    await connectDB();
    const data = await req.json();

    let settings = await Settings.findOne();
    
    if (settings) {
      settings.socials = data.socials || settings.socials;
      settings.phoneNumbers = data.phoneNumbers || settings.phoneNumbers;
      settings.emails = data.emails || settings.emails;
      await settings.save();
    } else {
      settings = await Settings.create({
        socials: data.socials || [],
        phoneNumbers: data.phoneNumbers || [],
        emails: data.emails || [],
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
