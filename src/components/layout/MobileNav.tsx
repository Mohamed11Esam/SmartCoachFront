import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bot, Dumbbell, Users, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';

export function MobileNav() {
  const location = useLocation();
  const { conversations } = useChatStore();

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const items = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Coach', path: '/ai/chat', icon: Bot, isAccent: true },
    { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    { label: 'Coaches', path: '/coaches', icon: Users },
    { label: 'Chat', path: '/chat', icon: MessageSquare, badge: totalUnread },
  ];

  return (
    <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-page/95 backdrop-blur-lg border-t border-border px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.path === '/ai/chat'
              ? location.pathname.startsWith('/ai')
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-status-declined text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
