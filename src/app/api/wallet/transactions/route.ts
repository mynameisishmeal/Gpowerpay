import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WalletService } from '@/lib/services/walletService';

/**
 * GET /api/wallet/transactions - Get transaction history
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as 'credit' | 'debit' | '' || '';

    const history = await WalletService.getTransactionHistory(
      session.user.id,
      page,
      limit,
      type || undefined
    );

    console.log('📊 History from WalletService:', {
      transactionsCount: history.transactions?.length,
      page: history.page,
      limit: history.limit,
      total: history.total,
      totalPages: history.totalPages,
      filterType: type || 'all',
    });

    const response = {
      success: true,
      transactions: history.transactions,
      pagination: {
        page: history.page,
        limit: history.limit,
        total: history.total,
        totalPages: history.totalPages,
      },
    };

    console.log('📤 Sending response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get transactions' },
      { status: 500 }
    );
  }
}
