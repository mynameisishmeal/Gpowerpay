import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WalletService } from '@/lib/services/walletService';

/**
 * GET /api/wallet/balance - Get wallet balance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const balance = await WalletService.getBalance(session.user.id);

    return NextResponse.json({
      success: true,
      balance,
      currency: 'NGN',
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get balance' },
      { status: 500 }
    );
  }
}
