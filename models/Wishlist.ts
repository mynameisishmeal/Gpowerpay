import mongoose, { Schema, Document } from 'mongoose';

/**
 * Wishlist Model
 * Stores user's favorite products
 */

export interface IWishlistItem {
  productId: mongoose.Types.ObjectId | string;
  productName: string;
  productSlug: string;
  image?: string;
  price: number;
  marketType: 'kilo' | 'carton';
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId | string;
  customerEmail: string;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>({
  productId: {
    type: String, // Changed from ObjectId to String to support composite IDs (kilo-xxx, carton-xxx)
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productSlug: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  marketType: {
    type: String,
    enum: ['kilo', 'carton'],
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    items: [WishlistItemSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
WishlistSchema.index({ userId: 1 });
WishlistSchema.index({ customerEmail: 1 });
WishlistSchema.index({ 'items.productId': 1 }); // String index for composite IDs

export default mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
