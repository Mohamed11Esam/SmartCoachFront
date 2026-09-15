import { Zap, ShieldCheck, Cpu, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-page mt-20 pb-16 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent fill-accent" />
              </div>
              <span className="text-base font-black tracking-tight text-text-primary">
                APEX<span className="text-accent">ATHLETIC</span>
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              The high-performance fitness platform unifying APEX AI intelligence, elite certified coaches, and science-backed training protocols.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-approved opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-approved"></span>
              </span>
              <span className="text-[11px] text-text-secondary font-medium">
                Systems & AI Operational
              </span>
            </div>
          </div>

          {/* Column 2: Training & AI */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
              AI & Training
            </h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li>
                <Link to="/ai/chat" className="hover:text-accent transition-colors">
                  APEX Fitness Chat
                </Link>
              </li>
              <li>
                <Link to="/ai/workout-plan" className="hover:text-accent transition-colors">
                  AI Workout Generator
                </Link>
              </li>
              <li>
                <Link to="/ai/meal-plan" className="hover:text-accent transition-colors">
                  AI Nutrition Planner
                </Link>
              </li>
              <li>
                <Link to="/workouts" className="hover:text-accent transition-colors">
                  Interactive Workout Player
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Coaching & Store */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
              Coaching & Store
            </h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li>
                <Link to="/coaches" className="hover:text-accent transition-colors">
                  Certified Coach Directory
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-accent transition-colors">
                  Live Coach Messaging
                </Link>
              </li>
              <li>
                <Link to="/store" className="hover:text-accent transition-colors">
                  Supplements & Gear
                </Link>
              </li>
              <li>
                <Link to="/progress" className="hover:text-accent transition-colors">
                  Progress Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform Security & Specs */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">
              Tech Ecosystem
            </h4>
            <div className="space-y-2.5 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-accent" />
                <span>FastAPI + APEX AI Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-status-approved" />
                <span>NestJS JWT + Socket.IO</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span>Zero Latency Live Sync</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} APEX Athletic Performance Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-text-secondary cursor-pointer">Privacy Policy</span>
            <span className="hover:text-text-secondary cursor-pointer">Terms of Service</span>
            <span className="hover:text-text-secondary cursor-pointer">Athlete Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
