import Notification from '@/lib/models/Notification';
import connectDB from '@/lib/mongodb';
import { sendOrderStatusEmail } from './emailService';
import { adminMessaging } from '@/lib/firebase-admin';
import User from '@/models/User';

export interface CreateNotificationInput {
  userId: string;
  type: 'order_placed' | 'order_status_changed' | 'delivery_status_changed' | 'rider_assigned' | 'payment_success' | 'payment_failed' | 'action_required' | 'new_message' | 'new_ticket' | 'ticket_updated';
  title: string;
  message: string;
  data?: any;
  sendEmail?: boolean;
  userEmail?: string;
  userName?: string;
  actionPath?: string;
  actionText?: string;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(input: CreateNotificationInput) {
    await connectDB();

    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || {},
      read: false,
      emailSent: false,
    });

    // Send email if requested
    if (input.sendEmail && input.userEmail) {
      try {
        await sendOrderStatusEmail({
          to: input.userEmail,
          userName: input.userName || 'Customer',
          orderId: input.data?.orderId || '',
          orderNumber: input.data?.orderNumber || '',
          confirmationCode: input.data?.confirmationCode,
          status: input.data?.status || input.data?.deliveryStatus || '',
          message: input.message,
          actionPath: input.actionPath,
          actionText: input.actionText,
        });

        // Mark email as sent
        notification.emailSent = true;
        await notification.save();
      } catch (error) {
        console.error('Failed to send notification email:', error);
        // Don't throw - notification is still created even if email fails
      }
    }

    // Send FCM Push Notification
    try {
      if (adminMessaging) {
        const user = await User.findById(input.userId).select('fcmTokens').lean();
        if (user && user.fcmTokens && user.fcmTokens.length > 0) {
          const payload = {
            notification: {
              title: input.title,
              body: input.message,
            },
            data: {
              type: input.type,
              ...(input.data && { extraData: JSON.stringify(input.data) })
            },
            android: {
              priority: 'high' as const,
              notification: {
                channelId: 'high_importance_channel',
                defaultSound: true,
                defaultVibrateTimings: true,
                notificationCount: 1,
                visibility: 'public' as const, // Ensures it shows on lock screen
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
            tokens: user.fcmTokens as string[],
          };

          const response = await adminMessaging.sendEachForMulticast(payload);
          console.log(`FCM send success: ${response.successCount}, failure: ${response.failureCount}`);
        }
      } else {
        console.log('FCM Push Notification skipped: Firebase Admin not initialized.');
      }
    } catch (error) {
      console.error('Failed to send FCM push notification:', error);
    }

    return notification;
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
    await connectDB();

    const skip = (page - 1) * limit;
    const filter: any = { userId };
    if (unreadOnly) filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, read: false }),
    ]);

    return {
      notifications,
      unreadCount,
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
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { returnDocument: 'after' }
    );

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    await connectDB();

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    return true;
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    await connectDB();

    await Notification.findOneAndDelete({ _id: notificationId, userId });
    return true;
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string) {
    await connectDB();

    const count = await Notification.countDocuments({ userId, read: false });
    return count;
  }

  /**
   * Helper: Create order placed notification
   */
  static async notifyOrderPlaced(
    userId: string, 
    orderId: string,
    userEmail: string, 
    userName: string, 
    orderNumber: string, 
    confirmationCode: string,
    total: number
  ) {
    return this.createNotification({
      userId,
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} has been placed successfully. Confirmation Code: ${confirmationCode}. Total: ₦${total.toLocaleString()}`,
      data: { orderId, orderNumber, confirmationCode, total },
      sendEmail: true,
      userEmail,
      userName,
    });
  }

  /**
   * Helper: Create delivery status changed notification
   */
  static async notifyDeliveryStatusChanged(
    userId: string,
    orderId: string,
    userEmail: string,
    userName: string,
    orderNumber: string,
    confirmationCode: string | undefined,
    deliveryStatus: string
  ) {
    const statusMessages: Record<string, string> = {
      in_store: '📦 Your order is being prepared in our store',
      on_the_way: '🚚 Your order is on the way! The delivery partner is heading to your location',
      delivered: '✅ Your order has been delivered! We hope you enjoy your purchase',
    };

    const statusTitles: Record<string, string> = {
      in_store: 'Order Being Prepared',
      on_the_way: 'Order Out for Delivery',
      delivered: 'Order Delivered',
    };

    return this.createNotification({
      userId,
      type: 'delivery_status_changed',
      title: statusTitles[deliveryStatus] || 'Delivery Status Updated',
      message: statusMessages[deliveryStatus] || `Delivery status updated for order #${orderNumber}`,
      data: { orderId, orderNumber, confirmationCode, deliveryStatus },
      sendEmail: true,
      userEmail,
      userName,
    });
  }

  /**
   * Helper: Create rider assigned notification
   */
  static async notifyRiderAssigned(
    userId: string,
    orderId: string,
    userEmail: string,
    userName: string,
    orderNumber: string,
    confirmationCode: string | undefined,
    riderName: string,
    riderPhone: string
  ) {
    return this.createNotification({
      userId,
      type: 'rider_assigned',
      title: 'Delivery Partner Assigned',
      message: `${riderName} has been assigned to deliver your order #${orderNumber}. Contact: ${riderPhone}`,
      data: { orderId, orderNumber, confirmationCode, riderName, riderPhone },
      sendEmail: true,
      userEmail,
      userName,
    });
  }

  /**
   * Helper: Notify rider of new order assignment
   */
  static async notifyRiderNewOrder(
    riderId: string,
    riderEmail: string,
    riderName: string,
    orderId: string,
    orderNumber: string,
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    totalAmount: number
  ) {
    return this.createNotification({
      userId: riderId,
      type: 'order_placed', // Using existing type, or create 'rider_order_assigned'
      title: 'New Delivery Order Assigned',
      message: `You have been assigned to deliver order #${orderNumber} to ${customerName}. Amount: ₦${totalAmount.toLocaleString()}`,
      data: { 
        orderId, 
        orderNumber, 
        customerName, 
        customerPhone, 
        deliveryAddress,
        totalAmount 
      },
      sendEmail: true,
      userEmail: riderEmail,
      userName: riderName,
      actionPath: `/rider/orders/${orderId}`,
      actionText: 'View Order Details',
    });
  }

  /**
   * Helper: Notify all admins (or specific admins)
   */
  static async notifyAdmins(
    type: CreateNotificationInput['type'],
    title: string,
    message: string,
    data?: any
  ) {
    await connectDB();
    // Support users might also need notifications, but user requested all super admin and admin
    const admins = await User.find({ role: { $in: ['sadmin', 'admin'] } }).select('_id').lean();
    
    const notificationPromises = admins.map(admin => 
      this.createNotification({
        userId: admin._id.toString(),
        type,
        title,
        message,
        data,
      })
    );

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Helper: Create new chat message notification
   */
  static async notifyNewChatMessage(
    userId: string,
    senderName: string,
    sessionId: string,
    messagePreview: string
  ) {
    return this.createNotification({
      userId,
      type: 'new_message',
      title: `New message from ${senderName}`,
      message: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
      data: { sessionId },
    });
  }

  /**
   * Helper: Create new ticket notification
   */
  static async notifyNewTicket(
    ticketId: string,
    subject: string,
    customerName: string
  ) {
    return this.notifyAdmins(
      'new_ticket',
      'New Support Ticket',
      `Ticket ${ticketId} created by ${customerName}: ${subject}`,
      { ticketId }
    );
  }

  /**
   * Helper: Create ticket reply notification
   */
  static async notifyTicketReply(
    userId: string,
    ticketId: string,
    subject: string,
    senderName: string
  ) {
    return this.createNotification({
      userId,
      type: 'ticket_updated',
      title: `New reply on ticket ${ticketId}`,
      message: `${senderName} replied to: ${subject}`,
      data: { ticketId },
    });
  }
}
