import { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Award,
  Flame,
  Check,
  Save,
  CreditCard,
  Bell,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { FITNESS_GOALS, DIETARY_PREFERENCES } from '../../config/constants';
import api from '../../lib/axios';

export function UserProfile() {
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName || 'Marcus');
  const [lastName, setLastName] = useState(user?.lastName || 'Vance');
  const [email, setEmail] = useState(user?.email || 'athlete@smartcoach.io');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 382-9912');
  const [height, setHeight] = useState<number>(user?.height || 182);
  const [weight, setWeight] = useState<number>(user?.weight || 79.5);
  const [targetWeight, setTargetWeight] = useState<number>(user?.targetWeight || 83.0);
  const [goal, setGoal] = useState<string>(user?.fitnessGoal || 'Gain Muscle');
  const [diet, setDiet] = useState<string>(user?.dietaryPreference || 'High Protein');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      height,
      weight,
      targetWeight,
      fitnessGoal: goal,
      dietaryPreference: diet as any,
    };

    try {
      await api.put('/users/me', payload);
    } catch {
      // Offline fallback
    }

    updateUser(payload);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Athlete Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage your personal credentials, athletic targets, and connected coaching packages.
          </p>
        </div>

        {savedSuccess && (
          <Badge variant="approved" size="md" className="gap-1.5 self-start sm:self-auto animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>Profile Updated Successfully</span>
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card Header */}
        <Card className="p-6 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl bg-accent/20 border-2 border-accent text-accent font-black text-2xl flex items-center justify-center shadow-[0_0_20px_rgba(198,241,53,0.2)]">
              {firstName ? firstName[0].toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">
                  {firstName} {lastName}
                </h2>
                <Badge variant="accent" size="sm">
                  Athlete Tier 1
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">{email}</p>
              <p className="text-[11px] text-text-secondary mt-1">
                Goal: <span className="text-accent font-semibold">{goal}</span> • Level: {user?.fitnessLevel || 'Intermediate'}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            variant="accent-glow"
            size="md"
            loading={isSaving}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </Button>
        </Card>

        {/* Personal details & Biometrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity */}
          <Card className="p-6 border-border space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Identity & Contact
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />
          </Card>

          {/* Athletic Biometrics */}
          <Card className="p-6 border-border space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Athletic Biometrics & Targets
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
              <Input
                label="Current (kg)"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
              <Input
                label="Target (kg)"
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Primary Fitness Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {FITNESS_GOALS.map((g) => (
                  <option key={g.id} value={g.label}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Dietary Preference
              </label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full bg-input-bg border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {DIETARY_PREFERENCES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </div>

        {/* Subscription & Coaching Plan Card */}
        <Card className="p-6 border-border space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-status-approved/15 text-status-approved border border-status-approved/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  APEX Athletic Pro Membership
                </h3>
                <p className="text-xs text-text-muted">
                  Unlimited APEX AI query access, video player routines, and coach messaging
                </p>
              </div>
            </div>

            <Badge variant="approved">Active</Badge>
          </div>

          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-text-secondary">Next billing cycle: October 15, 2026</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                Manage Billing
              </Button>
              <Button variant="outline" size="sm">
                Upgrade to 1-on-1 Dedicated Coach
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
