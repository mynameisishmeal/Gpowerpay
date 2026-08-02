import mongoose, { Schema, Model } from 'mongoose';

/**
 * Rider Review Model
 * Customers can review riders after delivery
 * Riders cannot see their own reviews
 */

export interface IRiderReview {
  _id: mongoose.Types.ObjectId;
  
  // Core Info
  riderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  
  // Review Content
  rating: number; // 1-5 stars
  comment?: string;
  
  // Customer Info (for display)
  customerName: string;
  
  // Review Aspects (optional detailed ratings)
  punctuality?: number; // 1-5
  professionalism?: number; // 1-5
  communication?: number; // 1-5
  
  // Status
  isPublic: boolean; // Admin can hide inappropriate reviews
  isVerified: boolean; // Only from completed deliveries
  
  // Admin Actions
  adminResponse?: string;
  moderatedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const RiderReviewSchema = new Schema<IRiderReview>(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true, // One review per order
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    adminResponse: {
      type: String,
    },
    moderatedAt: {
      type: Date,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
RiderReviewSchema.index({ riderId: 1, createdAt: -1 });
RiderReviewSchema.index({ riderId: 1, isPublic: 1 });
RiderReviewSchema.index({ customerId: 1, createdAt: -1 });

// Virtual for average rating calculation
RiderReviewSchema.statics.getAverageRating = async function (riderId: string) {
  const result = await this.aggregate([
    {
      $match: {
        riderId: new mongoose.Types.ObjectId(riderId),
        isPublic: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        averagePunctuality: { $avg: '$punctuality' },
        averageProfessionalism: { $avg: '$professionalism' },
        averageCommunication: { $avg: '$communication' },
      },
    },
  ]);

  return result[0] || {
    averageRating: 0,
    totalReviews: 0,
    averagePunctuality: 0,
    averageProfessionalism: 0,
    averageCommunication: 0,
  };
};

interface IRiderReviewModel extends Model<IRiderReview> {
  getAverageRating(riderId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    averagePunctuality: number;
    averageProfessionalism: number;
    averageCommunication: number;
  }>;
}

const RiderReview =
  (mongoose.models.RiderReview as IRiderReviewModel) ||
  mongoose.model<IRiderReview, IRiderReviewModel>('RiderReview', RiderReviewSchema);

export default RiderReview;
