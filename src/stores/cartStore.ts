import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  promoCode: string;
  discountPercentage: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number, flavor?: string, size?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getTotalCount: () => number;
}

const STORAGE_KEY = 'smartcoach_cart';

const loadSavedCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: loadSavedCart(),
  isOpen: false,
  promoCode: '',
  discountPercentage: 0,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addItem: (product, quantity = 1, flavor, size) => {
    const current = get().items;
    const existingIndex = current.findIndex(
      (item) =>
        item.productId === product._id &&
        item.selectedFlavor === flavor &&
        item.selectedSize === size
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = current.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      updated = [
        ...current,
        {
          productId: product._id,
          product,
          quantity,
          selectedFlavor: flavor,
          selectedSize: size,
        },
      ];
    }

    saveCart(updated);
    set({ items: updated, isOpen: true });
  },

  removeItem: (productId) => {
    const updated = get().items.filter((item) => item.productId !== productId);
    saveCart(updated);
    set({ items: updated });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const updated = get().items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    saveCart(updated);
    set({ items: updated });
  },

  applyPromoCode: (code) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === 'FITGLOW20' || trimmed === 'SMART20') {
      set({ promoCode: trimmed, discountPercentage: 20 });
      return { success: true, message: 'Promo code applied: 20% OFF!' };
    }
    if (trimmed === 'COACH15' || trimmed === 'WELCOME15') {
      set({ promoCode: trimmed, discountPercentage: 15 });
      return { success: true, message: 'Promo code applied: 15% OFF!' };
    }
    return { success: false, message: 'Invalid or expired promo code' };
  },

  removePromoCode: () => {
    set({ promoCode: '', discountPercentage: 0 });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [], promoCode: '', discountPercentage: 0 });
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => {
      const price = item.product.salePrice ?? item.product.price;
      return total + price * item.quantity;
    }, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = (subtotal * get().discountPercentage) / 100;
    return Number(discount.toFixed(2));
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const shipping = subtotal > 75 || subtotal === 0 ? 0 : 5.99;
    return Number((subtotal - discount + shipping).toFixed(2));
  },

  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
