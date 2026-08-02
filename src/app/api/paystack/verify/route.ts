import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PaystackService } from '@/lib/paystack';
import { WalletService } from '@/lib/services/walletService';

/**
 * POST /api/paystack/verify - Verify Paystack payment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reference, type } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paymentData = await PaystackService.verifyPayment(reference);

    if (paymentData.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Convert amount from kobo to naira
    const amount = PaystackService.toNaira(paymentData.amount);

    // Handle wallet funding
    if (type === 'wallet_funding') {
      await WalletService.creditWallet(
        session.user.id,
        amount,
        'Wallet funding via Paystack',
        reference,
        {
          paystackReference: paymentData.reference,
          channel: paymentData.channel,
          currency: paymentData.currency,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        amount,
        reference: paymentData.reference,
        status: paymentData.status,
        paidAt: paymentData.paid_at,
      },
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
