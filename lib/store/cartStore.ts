import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';

/**
 * Shopping Cart Store using Zustand
 * Persisted to localStorage
 */

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  marketType: 'kilo' | 'carton';
  image?: string;
  weight?: number;
  maxQuantity?: number;
  inStock: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, marketType?: 'kilo' | 'carton') => void;
  updateQuantity: (productId: string, quantity: number, marketType?: 'kilo' | 'carton') => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: (productId: string, marketType: 'kilo' | 'carton') => number;
  hasItem: (productId: string, marketType: 'kilo' | 'carton') => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.marketType === item.marketType
          );

          if (existingItem) {
            // Update quantity if item already in cart
            const newQuantity = existingItem.quantity + item.quantity;
            
            // Check max quantity
            if (item.maxQuantity && newQuantity > item.maxQuantity) {
              toast.error('Maximum quantity reached');
              return state;
            }

            toast.success(`Updated ${item.name} quantity in cart`);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.marketType === item.marketType
                  ? { ...i, quantity: newQuantity }
                  : i
              ),
            };
          }

          // Add new item
          toast.success(`${item.name} added to cart!`);
          return {
            items: [...state.items, item],
          };
        });
      },

      removeItem: (productId: string, marketType?: 'kilo' | 'carton') => {
        // If marketType is provided, remove only that specific item.
        // If not, remove all items with that productId (fallback for generic removal).
        const item = get().items.find(i => i.productId === productId && (!marketType || i.marketType === marketType));
        if (item) {
          toast.success(`${item.name} removed from cart`);
        }
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && (!marketType || i.marketType === marketType))),
        }));
      },

      updateQuantity: (productId: string, quantity: number, marketType?: 'kilo' | 'carton') => {
        if (quantity <= 0) {
          get().removeItem(productId, marketType);
          return;
        }

        set((state) => {
          const item = state.items.find(i => i.productId === productId && (!marketType || i.marketType === marketType));
          if (!item) return state;

          // Check if trying to exceed max quantity
          if (item.maxQuantity && quantity > item.maxQuantity) {
            toast.error(`Maximum available quantity is ${item.maxQuantity}`);
            return {
              items: state.items.map((i) =>
                i.productId === productId && (!marketType || i.marketType === marketType)
                  ? { ...i, quantity: item.maxQuantity! }
                  : i
              ),
            };
          }

          return {
            items: state.items.map((i) =>
              i.productId === productId && (!marketType || i.marketType === marketType)
                ? { ...i, quantity }
                : i
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: (productId: string, marketType?: 'kilo' | 'carton') => {
        const item = get().items.find((i) => i.productId === productId && (!marketType || i.marketType === marketType));
        return item ? item.quantity : 0;
      },

      hasItem: (productId: string, marketType?: 'kilo' | 'carton') => {
        return get().items.some((i) => i.productId === productId && (!marketType || i.marketType === marketType));
      },
    }),
    {
      name: 'gpowerpay-cart',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as any),
    }
  )
);
