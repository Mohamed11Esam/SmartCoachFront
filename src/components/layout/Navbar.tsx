import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Zap,
  ShoppingBag,
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  Bot,
  Sparkles,
  Award,
} from 'lucide-react';
import { NAV_LINKS } from '../../config/constants';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { getTotalCount, openCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const cartCount = getTotalCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-page/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center group-hover:border-accent transition-colors shadow-[0_0_12px_rgba(198,241,53,0.15)]">
              <Zap className="w-5 h-5 text-accent fill-accent" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-text-primary flex items-center gap-1.5">
                APEX<span className="text-accent">ATHLETIC</span>
              </span>
              <span className="text-[10px] text-text-muted font-semibold tracking-wider uppercase -mt-1">
                Performance Hub
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.path === '/ai/chat'
                  ? location.pathname.startsWith('/ai')
                  : location.pathname === link.path || location.pathname.startsWith(link.path + '/');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-card text-accent border border-border font-semibold shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-card/50'
                  } ${link.path === '/ai/chat' ? 'relative' : ''}`}
                >
                  <span className="flex items-center gap-1.5">
                    {link.label}
                    {link.path === '/ai/chat' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* AI Generator Quick Trigger */}
            <Link
              to="/ai/workout-plan"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Plan</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl bg-card border border-border hover:border-border-light text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-black text-xs font-black flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-card border border-border hover:border-border-light transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 text-accent font-bold text-xs flex items-center justify-center">
                    {user.firstName ? user.firstName[0].toUpperCase() : 'A'}
                  </div>
                  <span className="hidden md:inline-block text-xs font-semibold text-text-primary max-w-[90px] truncate">
                    {user.firstName}
                  </span>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn"
                    >
                    <div className="px-3 py-2 border-b border-border/60 mb-1">
                      <p className="text-xs font-bold text-text-primary">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                        <Award className="w-3 h-3" />
                        <span>{user.fitnessGoal || 'Hypertrophy Track'}</span>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-card-hover rounded-xl transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>My Profile & Metrics</span>
                    </Link>

                    <Link
                      to="/onboarding"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-card-hover rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Retake Onboarding</span>
                    </Link>

                    <div className="my-1 border-t border-border/40" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-status-declined hover:bg-status-declined/10 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:bg-accent-hover transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-card border border-border text-text-secondary hover:text-text-primary"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-page px-4 pt-2 pb-6 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-card"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              to="/ai/workout-plan"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent text-black font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate AI Routine
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
