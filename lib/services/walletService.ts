import Wallet from '@/models/Wallet';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * Wallet Service Layer
 * Handles all wallet-related business logic
 */

export class WalletService {
  /**
   * Get or create wallet for user
   */
  static async getOrCreateWallet(userId: string) {
    await connectDB();
    
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = await Wallet.createWallet(new mongoose.Types.ObjectId(userId)) as any;
    }
    
    return wallet;
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId: string): Promise<number> {
    await connectDB();
    const wallet = await this.getOrCreateWallet(userId);
    return wallet?.balance || 0;
  }

  /**
   * Credit wallet (add funds)
   */
  static async creditWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string,
    metadata?: Record<string, any>
  ) {
    await connectDB();
    
    const wallet = await this.getOrCreateWallet(userId);
    if (!wallet) throw new Error('Failed to get or create wallet');
    
    // Check for duplicate reference
    const existingTransaction = wallet.transactions?.find(
      (tx: any) => tx.reference === reference
    );
    
    if (existingTransaction) {
      throw new Error('Duplicate transaction reference');
    }
    
    await wallet.credit(amount, description, reference, metadata);
    
    return {
      success: true,
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1],
    };
  }

  /**
   * Debit wallet (deduct funds)
   */
  static async debitWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string,
    metadata?: Record<string, any>
  ) {
    await connectDB();
    
    console.log(`💰 WalletService.debitWallet called for user ${userId}, amount: ₦${amount}`);
    
    const wallet = await this.getOrCreateWallet(userId);
    if (!wallet) {
      console.error(`❌ Failed to get or create wallet for user ${userId}`);
      throw new Error('Failed to get or create wallet');
    }
    
    console.log(`💰 Current wallet balance: ₦${wallet.balance}`);
    
    // Check sufficient balance
    if (!wallet.hasSufficientBalance(amount)) {
      console.error(`❌ Insufficient balance. Required: ₦${amount}, Available: ₦${wallet.balance}`);
      throw new Error('Insufficient wallet balance');
    }
    
    // Check for duplicate reference
    const existingTransaction = wallet.transactions?.find(
      (tx: any) => tx.reference === reference
    );
    
    if (existingTransaction) {
      console.error(`❌ Duplicate transaction reference: ${reference}`);
      throw new Error('Duplicate transaction reference');
    }
    
    console.log(`💰 Debiting wallet...`);
    await wallet.debit(amount, description, reference, metadata);
    
    console.log(`✅ Wallet debited successfully. New balance: ₦${wallet.balance}`);
    
    return {
      success: true,
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1],
    };
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: 'credit' | 'debit'
  ) {
    await connectDB();
    
    const wallet = await this.getOrCreateWallet(userId);
    if (!wallet) throw new Error('Failed to get or create wallet');
    return wallet.getTransactionHistory(page, limit, type);
  }

  /**
   * Check if user has sufficient balance
   */
  static async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    await connectDB();
    
    const wallet = await this.getOrCreateWallet(userId);
    if (!wallet) return false;
    return wallet.hasSufficientBalance(amount);
  }

  /**
   * Get wallet details with recent transactions
   */
  static async getWalletDetails(userId: string) {
    await connectDB();
    
    const wallet = await this.getOrCreateWallet(userId);
    if (!wallet) throw new Error('Failed to get or create wallet');
    
    const recentTransactions = wallet.transactions
      ?.sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 10) || [];

    return {
      balance: wallet.balance,
      currency: wallet.currency,
      isActive: wallet.isActive,
      recentTransactions,
      totalTransactions: wallet.transactions?.length || 0,
    };
  }

  /**
   * Generate unique transaction reference
   */
  static generateReference(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
