import Review from '@/models/Review';
import Order from '@/models/Order';
import connectDB from '@/lib/mongodb';

/**
 * Review Service Layer
 * Handles review creation, validation, and management
 */

export interface CreateReviewInput {
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(input: CreateReviewInput) {
    await connectDB();

    // Check if customer already reviewed this product
    const existingReview = await Review.findOne({
      productId: input.productId,
      customerId: input.customerId,
    });

    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }

    // Check if customer purchased this product (verified purchase)
    const order = await Order.findOne({
      customerId: input.customerId,
      'items.productId': input.productId,
      status: 'delivered',
    }).sort({ createdAt: -1 });

    const verified = !!order;

    // Create review
    const review = await Review.create({
      productId: input.productId,
      customerId: input.customerId,
      customerName: input.customerName,
      rating: input.rating,
      title: input.title?.trim() || '',
      comment: input.comment?.trim() || '',
      images: input.images || [],
      verified,
      orderId: order?._id,
      orderNumber: order?.orderNumber,
      status: 'approved', // Auto-approve
    });

    return review;
  }

  /**
   * Get product reviews with pagination
   */
  static async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
    sort: 'recent' | 'helpful' | 'rating_high' | 'rating_low' = 'recent'
  ) {
    await connectDB();

    const skip = (page - 1) * limit;

    // Determine sort order
    let sortQuery: any = { createdAt: -1 };
    if (sort === 'helpful') {
      sortQuery = { helpful: -1, createdAt: -1 };
    } else if (sort === 'rating_high') {
      sortQuery = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating_low') {
      sortQuery = { rating: 1, createdAt: -1 };
    }

    const [reviews, total, stats] = await Promise.all([
      Review.find({ productId, status: 'approved' })
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId, status: 'approved' }),
      Review.aggregate([
        {
          $match: {
            productId: productId as any,
            status: 'approved',
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            rating5: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
            },
            rating4: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
            },
            rating3: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
            },
            rating2: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
            },
            rating1: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        rating5: 0,
        rating4: 0,
        rating3: 0,
        rating2: 0,
        rating1: 0,
      },
    };
  }

  /**
   * Get customer's review for a product
   */
  static async getCustomerReview(productId: string, customerId: string) {
    await connectDB();

    const review = await Review.findOne({
      productId,
      customerId,
    }).lean();

    return review;
  }

  /**
   * Update review
   */
  static async updateReview(
    reviewId: string,
    customerId: string,
    updates: { rating?: number; title?: string; comment?: string; images?: string[] }
  ) {
    await connectDB();

    const review = await Review.findOne({
      _id: reviewId,
      customerId,
    });

    if (!review) {
      throw new Error('Review not found');
    }

    Object.assign(review, updates);
    await review.save();

    return review;
  }

  /**
   * Delete review
   */
  static async deleteReview(reviewId: string, customerId: string) {
    await connectDB();

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      customerId,
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  }

  /**
   * Vote review as helpful
   */
  static async voteHelpful(reviewId: string, customerId: string, helpful: boolean) {
    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const customerIdObj = customerId as any;
    const hasVoted = review.helpfulVotes.some(
      (id) => id.toString() === customerId
    );

    if (hasVoted) {
      throw new Error('You have already voted on this review');
    }

    review.helpfulVotes.push(customerIdObj);
    if (helpful) {
      review.helpful += 1;
    } else {
      review.notHelpful += 1;
    }

    await review.save();
    return review;
  }

  /**
   * Check if customer can review product (must have purchased)
   */
  static async canReview(productId: string, customerId: string) {
    await connectDB();

    // Check if already reviewed
    const existingReview = await Review.findOne({
      productId,
      customerId,
    });

    if (existingReview) {
      return { canReview: false, reason: 'Already reviewed' };
    }

    // Check if purchased
    const order = await Order.findOne({
      customerId,
      'items.productId': productId,
      status: 'delivered',
    });

    if (!order) {
      return { canReview: true, reason: 'Not purchased (review allowed but not verified)' };
    }

    return { canReview: true, reason: 'Verified purchase' };
  }
}
