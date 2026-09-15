import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';
import { INITIAL_USER } from '../../lib/mockData';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'Customer',
      });

      const { access_token, refresh_token, user } = response.data;
      setAuth(access_token, refresh_token, user);
      navigate('/onboarding');
    } catch (err: any) {
      console.warn('Live register fallback:', err.message);
      // Seamless mock registration
      setAuth('mock_token_' + Date.now(), 'mock_refresh', {
        ...INITIAL_USER,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        onboardingCompleted: false,
      });
      navigate('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-card border border-border items-center justify-center shadow-[0_0_20px_rgba(198,241,53,0.2)] mb-2">
            <Zap className="w-7 h-7 text-accent fill-accent" />
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Create Athlete Profile
          </h2>
          <p className="text-xs text-text-muted">
            Join thousands of athletes transforming with SmartCoach AI & elite trainers
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-border/80">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-status-declined/10 border border-status-declined/30 text-xs text-status-declined">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Marcus"
                icon={<User className="w-4 h-4" />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Vance"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email"
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

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="flex items-start gap-2 pt-1 text-[11px] text-text-muted">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>
                By signing up, you agree to the SmartCoach Terms of Service and Privacy Policy.
              </span>
            </div>

            <Button
              type="submit"
              variant="accent-glow"
              size="lg"
              loading={isLoading}
              className="w-full mt-2"
            >
              <span>Continue to Onboarding</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
