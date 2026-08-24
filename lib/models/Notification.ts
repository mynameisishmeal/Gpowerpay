import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'order_placed' | 'order_status_changed' | 'delivery_status_changed' | 'rider_assigned' | 'payment_success' | 'payment_failed' | 'action_required' | 'new_message' | 'new_ticket' | 'ticket_updated';
  title: string;
  message: string;
  data?: {
    orderId?: string;
    orderNumber?: string;
    status?: string;
    deliveryStatus?: string;
    [key: string]: any;
  };
  read: boolean;
  emailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_status_changed',
        'delivery_status_changed',
        'rider_assigned',
        'payment_success',
        'payment_failed',
        'action_required',
        'new_message',
        'new_ticket',
        'ticket_updated',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Delete model if it exists to prevent HMR validation errors in Next.js development
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotification>('Notification', NotificationSchema);
