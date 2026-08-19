import connectDB from '@/lib/mongodb';
import Wishlist, { IWishlistItem } from '@/models/Wishlist';
import Product from '@/models/Product';
import { ProductService } from './productService';

/**
 * Wishlist Service
 * Business logic for wishlist operations
 */

export interface AddToWishlistParams {
  userId: string;
  customerEmail: string;
  productId: string;
  marketType?: 'kilo' | 'carton';
}

export class WishlistService {
  /**
   * Get user's wishlist
   */
  static async getWishlist(userId: string) {
    await connectDB();

    const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');

    if (!wishlist) {
      return { items: [] };
    }

    return wishlist;
  }

  /**
   * Add item to wishlist
   */
  static async addToWishlist(params: AddToWishlistParams) {
    await connectDB();

    const { userId, customerEmail, productId, marketType = 'kilo' } = params;

    console.log('🔍 WishlistService.addToWishlist - productId:', productId, 'marketType:', marketType);

    // Use ProductService to handle composite IDs (kilo-xxx, carton-xxx)
    const product = await ProductService.getProduct(productId);
    
    console.log('📦 Product found:', product ? product.name : 'NULL');
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Get pricing
    const pricing = product.pricing[marketType];
    if (!pricing) {
      throw new Error('Invalid market type for this product');
    }

    console.log('💰 Pricing:', pricing);

    // Get primary image
    const image = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        customerEmail,
        items: [],
      });
    }

    // Check if product already in wishlist
    const existingItemIndex = wishlist.items.findIndex(
      (item: IWishlistItem) => 
        String(item.productId) === productId && 
        item.marketType === marketType
    );

    if (existingItemIndex !== -1) {
      throw new Error('Product already in wishlist');
    }

    console.log('✅ Adding to wishlist:', {
      productId,
      productName: product.name,
      price: pricing.price,
      marketType,
    });

    // Add to wishlist - store the composite ID
    wishlist.items.push({
      productId: productId as any, // Store composite ID (kilo-xxx or carton-xxx)
      productName: product.name,
      productSlug: product.seo?.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      image: image?.url,
      price: pricing.price,
      marketType,
      addedAt: new Date(),
    });

    await wishlist.save();

    return wishlist;
  }

  /**
   * Remove item from wishlist
   */
  static async removeFromWishlist(userId: string, productId: string, marketType: 'kilo' | 'carton') {
    await connectDB();

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      throw new Error('Wishlist not found');
    }

    // Remove item - compare composite IDs directly
    wishlist.items = wishlist.items.filter(
      (item: IWishlistItem) =>
        !(item.productId === productId && item.marketType === marketType)
    );

    await wishlist.save();

    return wishlist;
  }

  /**
   * Clear entire wishlist
   */
  static async clearWishlist(userId: string) {
    await connectDB();

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      throw new Error('Wishlist not found');
    }

    wishlist.items = [];
    await wishlist.save();

    return wishlist;
  }

  /**
   * Check if product is in wishlist
   */
  static async isInWishlist(userId: string, productId: string, marketType: 'kilo' | 'carton') {
    await connectDB();

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return false;
    }

    return wishlist.items.some(
      (item: IWishlistItem) =>
        item.productId === productId && item.marketType === marketType
    );
  }

  /**
   * Get wishlist item count
   */
  static async getWishlistCount(userId: string) {
    await connectDB();

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return 0;
    }

    return wishlist.items.length;
  }
}
