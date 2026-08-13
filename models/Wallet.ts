import mongoose, { Schema, Model } from 'mongoose';

/**
 * Wallet Model - Digital wallet for customers
 */

export interface IWalletTransaction {
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IWallet {
  userId: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
  isActive: boolean;
  transactions: IWalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
    required: true,
    // unique removed - using schema.index() below for compound index instead
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, { 
  timestamps: true,
  _id: true 
});

const WalletSchema = new Schema<IWallet>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    // index: true removed - using schema.index() below instead
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'NGN',
    uppercase: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  transactions: [WalletTransactionSchema],
}, {
  timestamps: true,
});

// Indexes
WalletSchema.index({ 'transactions.reference': 1 });
WalletSchema.index({ 'transactions.createdAt': -1 });

// Methods

/**
 * Credit wallet (add funds)
 */
WalletSchema.methods.credit = async function(
  amount: number,
  description: string,
  reference: string,
  metadata?: Record<string, any>
) {
  const balanceBefore = this.balance;
  this.balance += amount;
  const balanceAfter = this.balance;

  this.transactions.push({
    type: 'credit',
    amount,
    description,
    reference,
    balanceBefore,
    balanceAfter,
    status: 'completed',
    metadata,
    createdAt: new Date(),
  });

  await this.save();
  return this;
};

/**
 * Debit wallet (deduct funds)
 */
WalletSchema.methods.debit = async function(
  amount: number,
  description: string,
  reference: string,
  metadata?: Record<string, any>
) {
  if (this.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  const balanceBefore = this.balance;
  this.balance -= amount;
  const balanceAfter = this.balance;

  this.transactions.push({
    type: 'debit',
    amount,
    description,
    reference,
    balanceBefore,
    balanceAfter,
    status: 'completed',
    metadata,
    createdAt: new Date(),
  });

  await this.save();
  return this;
};

/**
 * Check if wallet has sufficient balance
 */
WalletSchema.methods.hasSufficientBalance = function(amount: number): boolean {
  return this.balance >= amount;
};

/**
 * Get transaction history with pagination and optional type filter
 */
WalletSchema.methods.getTransactionHistory = function(
  page: number = 1,
  limit: number = 20,
  type?: 'credit' | 'debit'
) {
  const skip = (page - 1) * limit;
  
  // Filter transactions by type if specified
  let filteredTransactions = this.transactions;
  if (type) {
    filteredTransactions = this.transactions.filter((txn: any) => txn.type === type);
  }
  
  const sortedTransactions = filteredTransactions
    .sort((a: any, b: any) => b.createdAt - a.createdAt)
    .slice(skip, skip + limit);

  return {
    transactions: sortedTransactions,
    total: filteredTransactions.length,
    page,
    limit,
    totalPages: Math.ceil(filteredTransactions.length / limit),
  };
};

// Static methods

/**
 * Create wallet for user
 */
WalletSchema.statics.createWallet = async function(userId: mongoose.Types.ObjectId) {
  const existingWallet = await this.findOne({ userId });
  if (existingWallet) {
    return existingWallet;
  }

  const wallet = await this.create({
    userId,
    balance: 0,
    currency: 'NGN',
    isActive: true,
  });

  return wallet;
};

/**
 * Get wallet by user ID
 */
WalletSchema.statics.getByUserId = async function(userId: string | mongoose.Types.ObjectId) {
  const wallet = await this.findOne({ userId });
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  return wallet;
};

// Extend Mongoose model interface
interface IWalletMethods {
  credit(amount: number, description: string, reference: string, metadata?: Record<string, any>): Promise<IWallet>;
  debit(amount: number, description: string, reference: string, metadata?: Record<string, any>): Promise<IWallet>;
  hasSufficientBalance(amount: number): boolean;
  getTransactionHistory(page?: number, limit?: number, type?: 'credit' | 'debit'): any;
}

interface IWalletModel extends Model<IWallet, {}, IWalletMethods> {
  createWallet(userId: mongoose.Types.ObjectId): Promise<IWallet & IWalletMethods>;
  getByUserId(userId: string | mongoose.Types.ObjectId): Promise<IWallet & IWalletMethods>;
}

const Wallet = (mongoose.models.Wallet as IWalletModel) || 
  mongoose.model<IWallet, IWalletModel>('Wallet', WalletSchema);

export default Wallet;
