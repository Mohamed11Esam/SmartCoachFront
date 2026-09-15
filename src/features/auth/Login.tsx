import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Attempt live backend login
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { access_token, refresh_token, user } = response.data;
      setAuth(access_token, refresh_token, user);

      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.warn('Backend login error:', err.message);
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : null) ||
        err.response?.data?.error?.message ||
        'Invalid email or password. Please try again.';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAthlete = () => {
    setValue('email', 'user@example.com');
    setValue('password', 'password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-card border border-border items-center justify-center shadow-[0_0_20px_rgba(198,241,53,0.2)] mb-2">
            <Zap className="w-7 h-7 text-accent fill-accent" />
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome back, Athlete
          </h2>
          <p className="text-xs text-text-muted">
            Access your personalized AI workouts, macro tracking, and coach feedback
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 shadow-2xl border-border/80">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {authError && (
              <div className="p-3 rounded-xl bg-status-declined/10 border border-status-declined/30 text-xs text-status-declined">
                {authError}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="athlete@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border bg-input-bg text-accent focus:ring-accent"
                />
                Remember me
              </label>
              <a href="#forgot" className="text-accent hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="accent-glow"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/60">
            <button
              type="button"
              onClick={fillDemoAthlete}
              className="w-full py-2.5 px-4 rounded-xl bg-card-hover border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-accent/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Fill Demo Athlete Credentials</span>
            </button>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-text-muted">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Create an athlete account
          </Link>
        </p>
      </div>
    </div>
  );
}
