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
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: (productId: string) => number;
  hasItem: (productId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item: CartItem) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId
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
                i.productId === item.productId
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

      removeItem: (productId: string) => {
        const item = get().items.find(i => i.productId === productId);
        if (item) {
          toast.success(`${item.name} removed from cart`);
        }
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const item = state.items.find(i => i.productId === productId);
          if (!item) return state;

          // Check if trying to exceed max quantity
          if (item.maxQuantity && quantity > item.maxQuantity) {
            toast.error(`Maximum available quantity is ${item.maxQuantity}`);
            return {
              items: state.items.map((i) =>
                i.productId === productId
                  ? { ...i, quantity: item.maxQuantity! } // Non-null assertion since we checked it exists
                  : i
              ),
            };
          }

          return {
            items: state.items.map((i) =>
              i.productId === productId
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

      getItemCount: (productId: string) => {
        const item = get().items.find((i) => i.productId === productId);
        return item ? item.quantity : 0;
      },

      hasItem: (productId: string) => {
        return get().items.some((i) => i.productId === productId);
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
