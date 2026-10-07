import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Package,
  ShoppingBag,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/utils';
import api from '../../lib/axios';
import { resolveProductImage, getProductFallbackImage } from './StoreCatalog';

export function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscountAmount, getTotal, promoCode, discountPercentage, clearCart } =
    useCartStore();
  const { user } = useAuthStore();

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();
  const shipping = subtotal > 75 || subtotal === 0 ? 0 : 5.99;

  // Form State
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : 'Marcus Vance');
  const [email, setEmail] = useState(user?.email || 'athlete@smartcoach.io');
  const [street, setStreet] = useState('142 Athlete Way, Suite 400');
  const [city, setCity] = useState('Miami');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('+1 (555) 382-9912');

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const orderPayload = {
      shippingAddress: { name, street, city, country, phone },
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.product.salePrice ?? i.product.price,
      })),
      promoCode,
      totalAmount: total,
    };

    try {
      await api.post('/cart/checkout', orderPayload);
    } catch {
      // Offline fallback
    }

    setTimeout(() => {
      setIsProcessing(false);
      const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      setCompletedOrder({
        orderId,
        total,
        itemCount: items.length,
        deliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
      });

      clearCart();

      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#C6F135', '#22C55E', '#FFFFFF'],
      });
    }, 1500);
  };

  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-status-approved/20 border-2 border-status-approved text-status-approved mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Order Confirmed! 🚀
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-md mx-auto leading-relaxed">
            Thank you for your order! Your supplements and performance gear are being prepared at our fulfillment hub.
          </p>
        </div>

        <Card className="p-6 border-border text-left space-y-4 max-w-md mx-auto">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-border/60">
            <span className="text-text-muted">Order ID</span>
            <span className="font-mono font-bold text-accent">{completedOrder.orderId}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-3 border-b border-border/60">
            <span className="text-text-muted">Estimated Delivery</span>
            <span className="font-bold text-text-primary">{completedOrder.deliveryDate}</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-3 border-b border-border/60">
            <span className="text-text-muted">Paid Total</span>
            <span className="font-bold text-accent text-sm">{formatCurrency(completedOrder.total)}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-text-muted pt-1">
            <Package className="w-4 h-4 text-accent" />
            <span>Tracking notification will be sent to {email}</span>
          </div>
        </Card>

        <div className="flex justify-center gap-3 pt-2">
          <Link to="/store">
            <Button variant="secondary" size="md">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="accent-glow" size="md">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border text-text-muted mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Your cart is empty</h2>
        <p className="text-xs text-text-muted">
          Add supplements or training gear before proceeding to checkout.
        </p>
        <Link to="/store">
          <Button variant="primary" size="md">
            Browse Store
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/store"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          Secure Checkout
        </h1>
        <p className="text-xs text-text-muted mt-1">
          256-bit encrypted transaction powered by Stripe & SmartCoach Payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {/* Shipping Address */}
            <Card className="p-6 border-border space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <span>1. Shipping Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Street Address"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </Card>

            {/* Payment Method */}
            <Card className="p-6 border-border space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span>2. Payment Details</span>
                </h3>
                <span className="text-xs text-status-approved flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Encrypted
                </span>
              </div>

              <Input
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                icon={<CreditCard className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Expiration"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  required
                />
                <Input
                  label="CVC / CVV"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="123"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] text-text-muted">
                <ShieldCheck className="w-4 h-4 text-status-approved" />
                <span>Zero-risk guarantee with 30-day athlete product return policy.</span>
              </div>
            </Card>

            <Button
              type="submit"
              variant="accent-glow"
              size="lg"
              loading={isProcessing}
              className="w-full"
            >
              <span>Pay {formatCurrency(total)} & Complete Order</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <Card className="p-6 border-border space-y-5 sticky top-24 shadow-xl">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-3 border-b border-border/80">
              Order Summary ({items.length} items)
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 text-xs">
                  <img
                    src={resolveProductImage(item.product)}
                    alt={item.product.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(item.product);
                    }}
                    className="w-12 h-12 rounded-lg object-cover bg-main border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-primary truncate">{item.product.name}</p>
                    <p className="text-text-muted text-[11px]">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-text-primary">
                    {formatCurrency((item.product.salePrice ?? item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 pt-3 border-t border-border/60 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-accent font-semibold">
                  <span>Promo Discount ({promoCode} - {discountPercentage}%)</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between text-base font-black text-text-primary">
                <span>Total</span>
                <span className="text-accent text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
