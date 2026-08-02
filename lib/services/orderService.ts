import Order from '@/models/Order';
import connectDB from '@/lib/mongodb';
import { WalletService } from './walletService';
import { populateOrderProductNames, populateOrdersProductNames } from '@/lib/utils/orderUtils';
import type { CartItem } from '@/lib/store/cartStore';

/**
 * Order Service Layer
 * Handles order creation, management, and tracking
 */

export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryOption: 'home' | 'pickup';
  deliveryType?: 'bulk' | 'small';
  deliveryAddress?: any;
  deliveryDate?: string;
  pickupDate?: string;
  paymentMethod: 'wallet' | 'paystack' | 'split';
  paymentReference?: string;
}

export class OrderService {
  /**
   * Generate a 6-digit confirmation code
   */
  private static generateConfirmationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create new order
   */
  static async createOrder(input: CreateOrderInput) {
    await connectDB();

    // Generate unique order number
    const orderNumber = `GPO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Generate 6-digit confirmation code
    const confirmationCode = this.generateConfirmationCode();

    // Transform cart items to order items
    const orderItems = input.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      price: item.price,
      quantity: item.quantity,
      marketType: item.marketType,
      image: item.image,
      subtotal: item.price * item.quantity,
    }));

    // Create order
    const order = await Order.create({
      orderNumber,
      confirmationCode,
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      items: orderItems,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      total: input.total,
      deliveryOption: input.deliveryOption,
      deliveryType: input.deliveryType,
      deliveryAddress: input.deliveryAddress,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
      pickupDate: input.pickupDate ? new Date(input.pickupDate) : undefined,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',
      paymentReference: input.paymentReference,
      status: 'pending',
      deliveryStatus: 'in_store',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created',
      }],
    });

    return order;
  }

  /**
   * Process payment and update order
   */
  static async processPayment(
    orderId: string,
    paymentMethod: 'wallet' | 'paystack' | 'split',
    paymentReference: string
  ) {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    console.log(`💳 Processing payment for order ${order.orderNumber}`);
    console.log(`💳 Payment method: ${paymentMethod}`);
    console.log(`💳 Order total: ₦${order.total}`);

    // Handle wallet or split payment
    if (paymentMethod === 'wallet' || paymentMethod === 'split') {
      console.log(`💰 Attempting to debit wallet for customer ${order.customerId}`);
      
      // For split payment, debit available wallet balance (up to order total)
      if (paymentMethod === 'split') {
        const walletBalance = await WalletService.getBalance(order.customerId.toString());
        console.log(`💰 Split payment - Wallet balance: ₦${walletBalance}`);
        
        if (walletBalance > 0) {
          const amountToDebit = Math.min(walletBalance, order.total);
          console.log(`💰 Debiting ₦${amountToDebit} from wallet`);
          
          try {
            const result = await WalletService.debitWallet(
              order.customerId.toString(),
              amountToDebit,
              `Payment for order ${order.orderNumber}`,
              `${paymentReference}-WALLET`,
              { orderId: order._id.toString(), orderNumber: order.orderNumber }
            );
            console.log(`✅ Wallet debited successfully. New balance: ₦${result.balance}`);
          } catch (error: any) {
            console.error(`❌ Failed to debit wallet:`, error.message);
            throw error;
          }
        } else {
          console.log(`⚠️ No wallet balance to debit for split payment`);
        }
      } else {
        // Full wallet payment
        try {
          const result = await WalletService.debitWallet(
            order.customerId.toString(),
            order.total,
            `Payment for order ${order.orderNumber}`,
            paymentReference,
            { orderId: order._id.toString(), orderNumber: order.orderNumber }
          );
          console.log(`✅ Wallet debited successfully. New balance: ₦${result.balance}`);
        } catch (error: any) {
          console.error(`❌ Failed to debit wallet:`, error.message);
          throw error; // Re-throw to fail the order
        }
      }
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    order.paymentReference = paymentReference;
    order.status = 'processing';
    await order.save();

    console.log(`✅ Order ${order.orderNumber} payment processed successfully`);

    return order;
  }

  /**
   * Get customer orders with pagination
   */
  static async getCustomerOrders(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ) {
    await connectDB();

    const skip = (page - 1) * limit;

    // Find orders without .lean() so we can modify and save
    const ordersQuery = Order.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [orders, total] = await Promise.all([
      ordersQuery.exec(),
      Order.countDocuments({ customerId }),
    ]);

    // Auto-generate confirmation codes for orders that don't have them
    const updatedOrders = [];
    for (const order of orders) {
      if (!order.confirmationCode) {
        order.confirmationCode = this.generateConfirmationCode();
        await order.save();
        console.log(`✅ Auto-generated confirmation code ${order.confirmationCode} for order ${order.orderNumber}`);
      }
      updatedOrders.push(order.toObject());
    }

    // Populate product names
    const ordersWithNames = await populateOrdersProductNames(updatedOrders);

    return {
      orders: ordersWithNames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get single order by ID
   */
  static async getOrderById(orderId: string, customerId?: string) {
    await connectDB();

    const query: any = { _id: orderId };
    if (customerId) {
      query.customerId = customerId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      throw new Error('Order not found');
    }

    // Auto-generate confirmation code if missing
    if (!order.confirmationCode) {
      order.confirmationCode = this.generateConfirmationCode();
      await order.save();
      console.log(`✅ Auto-generated confirmation code ${order.confirmationCode} for order ${order.orderNumber}`);
    }

    // Populate product names
    const orderWithNames = await populateOrderProductNames(order.toObject());

    return orderWithNames;
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber: string, customerId?: string) {
    await connectDB();

    const query: any = { orderNumber };
    if (customerId) {
      query.customerId = customerId;
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Cancel order (customer can only cancel pending orders)
   */
  static async cancelOrder(orderId: string, customerId: string, reason: string) {
    await connectDB();

    const order = await Order.findOne({
      _id: orderId,
      customerId,
      status: 'pending',
    });

    if (!order) {
      throw new Error('Order not found or cannot be cancelled');
    }

    // Refund if already paid
    if (order.paymentStatus === 'paid') {
      await WalletService.creditWallet(
        customerId,
        order.total,
        `Refund for cancelled order ${order.orderNumber}`,
        `REFUND-${order.orderNumber}`,
        { orderId: order._id.toString(), orderNumber: order.orderNumber }
      );
      order.paymentStatus = 'refunded';
    }

    order.status = 'cancelled';
    order.cancelReason = reason;
    await order.save();

    return order;
  }

  /**
   * Update order status (admin)
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
  ) {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status as any;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note,
    });

    if (status === 'delivered') {
      order.completedAt = new Date();
    }

    await order.save();
    return order;
  }

  /**
   * Assign rider to order (admin)
   */
  static async assignRider(orderId: string, riderId: string, riderName: string) {
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.riderId = riderId as any;
    order.riderName = riderName;
    await order.save();

    return order;
  }

  /**
   * Get order statistics
   */
  static async getOrderStats(customerId?: string) {
    await connectDB();

    const match: any = {};
    if (customerId) {
      match.customerId = customerId;
    }

    const stats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
    ]);

    return stats;
  }
}
