import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, ScrollRestoration } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { CartDrawer } from '../../features/store/CartDrawer';
import { useAuthStore } from '../../stores/authStore';

export function ClientLayout() {
  const { hydrate } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Reset window scroll position to top when navigating to any page (such as /chat or /ai/chat)
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    hydrate();

    const handleAuthExpired = () => {
      navigate('/login');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [hydrate, navigate]);

  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col selection:bg-accent selection:text-black">
      <ScrollRestoration />
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8">
        <Outlet />
      </main>

      <CartDrawer />
      <MobileNav />
      <Footer />
    </div>
  );
}
