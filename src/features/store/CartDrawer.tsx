import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, Tag, Check, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    promoCode,
    applyPromoCode,
    removePromoCode,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    discountPercentage,
  } = useCartStore();

  const [inputCode, setInputCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();
  const freeShippingThreshold = 75;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const res = applyPromoCode(inputCode);
    setPromoMessage({
      text: res.message,
      isError: !res.success,
    });
  };

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-border flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-text-primary">Your Shopping Cart</h2>
              <span className="text-xs bg-main text-text-secondary px-2 py-0.5 rounded-full border border-border">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-main transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free shipping banner */}
          <div className="bg-main/60 px-5 py-2.5 border-b border-border/60 text-xs">
            {remainingForFreeShipping > 0 ? (
              <p className="text-text-secondary">
                Add <span className="font-bold text-accent">{formatCurrency(remainingForFreeShipping)}</span> more for <span className="text-text-primary font-semibold">FREE Shipping</span>
              </p>
            ) : (
              <p className="text-status-approved font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> You've unlocked FREE Express Shipping!
              </p>
            )}
            <div className="w-full bg-card h-1.5 rounded-full mt-2 overflow-hidden border border-border/40">
              <div
                className="bg-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-main border border-border flex items-center justify-center text-text-muted">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Your cart is empty</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Fuel your athletic performance with top-grade supplements and training gear.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    closeCart();
                    navigate('/store');
                  }}
                >
                  Explore Store
                </Button>
              </div>
            ) : (
              items.map((item) => {
                const price = item.product.salePrice ?? item.product.price;
                return (
                  <div
                    key={`${item.productId}-${item.selectedFlavor}-${item.selectedSize}`}
                    className="flex gap-3.5 p-3 rounded-xl bg-main/50 border border-border/80 relative group"
                  >
                    <img
                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=200'}
                      alt={item.product.name}
                      className="w-18 h-18 rounded-lg object-cover bg-main border border-border"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary truncate">
                          {item.product.name}
                        </h4>
                        {(item.selectedFlavor || item.selectedSize) && (
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {item.selectedFlavor && <span>Flavor: {item.selectedFlavor}</span>}
                            {item.selectedFlavor && item.selectedSize && <span> • </span>}
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                          </p>
                        )}
                        <p className="text-xs font-semibold text-accent mt-1">
                          {formatCurrency(price)}
                        </p>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded-lg bg-card">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-2.5 text-text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-text-muted hover:text-status-declined p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Promo code & Totals Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-border bg-main/40 space-y-4">
              {/* Promo code form */}
              {promoCode ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-xs">
                  <div className="flex items-center gap-1.5 text-accent font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Promo Applied: {promoCode} ({discountPercentage}% OFF)</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-text-muted hover:text-status-declined text-xs underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Enter SMART20 or COACH15"
                    className="flex-1 bg-input-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Apply
                  </Button>
                </form>
              )}

              {promoMessage && (
                <p className={`text-xs ${promoMessage.isError ? 'text-status-declined' : 'text-accent'}`}>
                  {promoMessage.text}
                </p>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent font-semibold">
                    <span>Discount ({discountPercentage}%)</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span>{remainingForFreeShipping === 0 ? 'FREE' : formatCurrency(5.99)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-text-primary">
                  <span>Total</span>
                  <span className="text-accent text-base">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="accent-glow"
                size="lg"
                className="w-full justify-center"
                onClick={handleCheckout}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
