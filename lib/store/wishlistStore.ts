import { create } from 'zustand';

/**
 * Wishlist Store using Zustand
 * Manages wishlist state and sync with API
 */

export interface WishlistItem {
  productId: string;
  productName: string;
  productSlug: string;
  image?: string;
  price: number;
  marketType: 'kilo' | 'carton';
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  
  // Actions
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string, marketType?: 'kilo' | 'carton') => Promise<boolean>;
  removeFromWishlist: (productId: string, marketType: 'kilo' | 'carton') => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string, marketType: 'kilo' | 'carton') => boolean;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/wishlist');
      const data = await response.json();

      if (data.success) {
        set({ items: data.wishlist.items || [] });
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      set({ loading: false });
    }
  },

  addToWishlist: async (productId: string, marketType: 'kilo' | 'carton' = 'kilo') => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, marketType }),
      });

      const data = await response.json();

      if (data.success) {
        set({ items: data.wishlist.items });
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  },

  removeFromWishlist: async (productId: string, marketType: 'kilo' | 'carton') => {
    try {
      const response = await fetch(
        `/api/wishlist?productId=${productId}&marketType=${marketType}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        set({ items: data.wishlist.items });
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  },

  clearWishlist: async () => {
    try {
      const response = await fetch('/api/wishlist?clearAll=true', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        set({ items: [] });
      }
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
      throw error;
    }
  },

  isInWishlist: (productId: string, marketType: 'kilo' | 'carton') => {
    return get().items.some(
      (item) => item.productId === productId && item.marketType === marketType
    );
  },

  getCount: () => {
    return get().items.length;
  },
}));
