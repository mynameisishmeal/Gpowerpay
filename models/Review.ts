import mongoose, { Schema, Model } from 'mongoose';

/**
 * Review Model - Product reviews and ratings by customers
 */

export interface IReview {
  productId: string; // Changed from ObjectId to support composite IDs like "carton-xxx" or "kilo-xxx"
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  
  rating: number; // 1-5 stars
  title?: string;
  comment?: string;
  
  images?: string[]; // Optional review images
  
  helpful: number; // Count of "helpful" votes
  notHelpful: number; // Count of "not helpful" votes
  helpfulVotes: mongoose.Types.ObjectId[]; // Users who voted helpful
  
  verified: boolean; // Verified purchase
  status: 'pending' | 'approved' | 'rejected';
  moderationNote?: string;
  
  response?: {
    message: string;
    respondedBy: mongoose.Types.ObjectId;
    respondedAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  productId: {
    type: String, // Changed from ObjectId to support composite IDs like "carton-xxx" or "kilo-xxx"
    required: true,
    index: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  orderNumber: String,
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: false,
    default: '',
    maxlength: 100,
  },
  comment: {
    type: String,
    required: false,
    default: '',
    maxlength: 1000,
  },
  
  images: [String],
  
  helpful: {
    type: Number,
    default: 0,
  },
  notHelpful: {
    type: Number,
    default: 0,
  },
  helpfulVotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  verified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // Auto-approve for now
    index: true,
  },
  moderationNote: String,
  
  response: {
    message: String,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    respondedAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, customerId: 1 }, { unique: true }); // One review per product per customer

// Update product rating after review save
ReviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    await updateProductRating(this.productId);
  }
});

// Update product rating after review update
ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateProductRating(doc.productId);
  }
});

// Update product rating after review delete
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateProductRating(doc.productId);
  }
});

// Helper to update product average rating
async function updateProductRating(productId: string) {
  const Product = mongoose.models.Product;
  if (!Product) return;

  const Review = mongoose.models.Review;
  const stats = await Review.aggregate([
    {
      $match: {
        productId,
        status: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const { averageRating = 0, reviewCount = 0 } = stats[0] || {};

  // NOTE: Can't update legacy products, this is a no-op for now
  // await Product.findByIdAndUpdate(productId, {
  //   averageRating: Math.round(averageRating * 10) / 10,
  //   reviewCount,
  // });
}

const Review: Model<IReview> = 
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
