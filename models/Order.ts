import mongoose, { Schema, Model } from 'mongoose';

/**
 * Order Model - Customer orders with delivery tracking
 */

export interface IOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  marketType: 'kilo' | 'carton';
  image?: string;
  subtotal: number;
}

export interface IOrder {
  orderNumber: string;
  confirmationCode: string; // 6-digit code for customer/rider verification
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  
  deliveryOption: 'home' | 'pickup';
  deliveryType?: 'bulk' | 'small';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    landmark?: string;
    phone: string;
  };
  deliveryDate?: Date;
  pickupDate?: Date;
  deliveryStatus?: 'in_store' | 'on_the_way' | 'rider_delivered' | 'sadmin_delivered' | 'delivered' | 'disputed';
  assignedRider?: {
    riderId: string;
    name: string;
    phone: string;
    image?: string;
  };
  
  paymentMethod: 'wallet' | 'paystack' | 'split';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  
  status: 'pending' | 'processing' | 'out_for_delivery' | 'rider_delivered' | 'sadmin_delivered' | 'delivered' | 'cancelled' | 'disputed';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  
  riderId?: mongoose.Types.ObjectId;
  riderName?: string;
  
  notes?: string;
  cancelReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: false, default: 'Product' }, // Made optional with default
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  marketType: { type: String, enum: ['kilo', 'carton'], required: true },
  image: { type: String },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  confirmationCode: {
    type: String,
    required: true,
    index: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: {
    type: String,
    required: function(this: any): boolean {
      return this.deliveryOption === 'home'; // Only required for home delivery
    },
  },
  
  items: [OrderItemSchema],
  
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  
  deliveryOption: {
    type: String,
    enum: ['home', 'pickup'],
    required: true,
  },
  deliveryType: {
    type: String,
    enum: ['bulk', 'small'],
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    landmark: String,
    phone: String,
  },
  deliveryDate: Date,
  pickupDate: Date,
  deliveryStatus: {
    type: String,
    enum: ['in_store', 'on_the_way', 'rider_delivered', 'sadmin_delivered', 'delivered', 'disputed'],
    default: 'in_store',
  },
  assignedRider: {
    riderId: String,
    name: String,
    phone: String,
    image: String,
  },
  
  paymentMethod: {
    type: String,
    enum: ['wallet', 'paystack', 'split'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  paymentReference: String,
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'out_for_delivery', 'rider_delivered', 'sadmin_delivered', 'delivered', 'cancelled', 'disputed'],
    default: 'pending',
    index: true,
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    note: String,
  }],
  
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'Rider',
  },
  riderName: String,
  
  notes: String,
  cancelReason: String,
  completedAt: Date,
}, {
  timestamps: true,
});

// Indexes
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Static methods
OrderSchema.statics.generateOrderNumber = function(): string {
  const prefix = 'GP';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const Order: Model<IOrder> = 
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
