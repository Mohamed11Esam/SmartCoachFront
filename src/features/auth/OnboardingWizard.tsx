import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  Flame,
  TrendingDown,
  Activity,
  HeartPulse,
  Dumbbell,
  Check,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAuthStore } from '../../stores/authStore';
import { calculateBMI } from '../../lib/utils';
import { FITNESS_GOALS, FITNESS_LEVELS, DIETARY_PREFERENCES, COMMON_ALLERGIES } from '../../config/constants';
import api from '../../lib/axios';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // State
  const [goal, setGoal] = useState<string>(user?.fitnessGoal || 'Gain Muscle');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    user?.fitnessLevel || 'Intermediate'
  );
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.gender || 'Male');
  const [height, setHeight] = useState<number>(user?.height || 180);
  const [weight, setWeight] = useState<number>(user?.weight || 78);
  const [targetWeight, setTargetWeight] = useState<number>(user?.targetWeight || 82);
  const [diet, setDiet] = useState<string>(user?.dietaryPreference || 'High Protein Lean');
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { bmi, category: bmiCategory } = calculateBMI(weight, height);

  // Dynamic calorie target estimate
  const estimatedCalories = Math.round(
    gender === 'Male'
      ? 10 * weight + 6.25 * height - 5 * 25 + 5 + (goal === 'Gain Muscle' ? 400 : -400)
      : 10 * weight + 6.25 * height - 5 * 25 - 161 + (goal === 'Gain Muscle' ? 350 : -350)
  );

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const finishOnboarding = async () => {
    setIsSubmitting(true);

    const onboardingPayload = {
      gender,
      height,
      weight,
      targetWeight,
      fitnessGoal: goal,
      fitnessLevel: level,
      dietaryPreference: diet,
      allergies,
      dailyCalorieTarget: estimatedCalories,
      dailyWaterTarget: 3500,
      onboardingCompleted: true,
    };

    try {
      await api.put('/users/me', onboardingPayload);
    } catch (e) {
      console.warn('Saved onboarding locally:', e);
    }

    updateUser(onboardingPayload);

    // Confetti celebration
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C6F135', '#22C55E', '#FFFFFF'],
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Step Counter & Progress */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
          <span className="text-accent flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Step {step} of {totalSteps}
          </span>
          <span>{Math.round((step / totalSteps) * 100)}% Profile Calibrated</span>
        </div>
        <ProgressBar value={step} max={totalSteps} variant="accent" height="sm" />
      </div>

      <Card className="p-8 shadow-2xl border-border/80 relative overflow-hidden">
        {/* Step 1: Goals & Level */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                What is your primary athletic objective?
              </h2>
              <p className="text-xs text-text-muted mt-1">
                SmartCoach AI will calibrate your training volume, periodization, and daily macro targets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'Gain Muscle', label: 'Hypertrophy & Muscle Gain', icon: Flame },
                { id: 'Weight Loss', label: 'Fat Loss & Definition', icon: TrendingDown },
                { id: 'Endurance', label: 'Endurance & Stamina', icon: Activity },
                { id: 'Maintenance', label: 'Longevity & Health', icon: HeartPulse },
                { id: 'Raw Strength', label: 'Raw Strength & Power', icon: Dumbbell },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-text-primary shadow-[0_0_15px_rgba(198,241,53,0.15)]'
                        : 'bg-main border-border text-text-secondary hover:border-border-light hover:bg-card-hover'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-accent text-black font-bold' : 'bg-card text-text-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{item.label}</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">Optimized AI Plan</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border/60">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Experience & Training Age
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {FITNESS_LEVELS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      level === item.id
                        ? 'bg-accent text-black font-bold border-accent shadow-sm'
                        : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] opacity-75 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Body Biometrics */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                Your Physical Biometrics
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Used to calculate accurate basal metabolic rate (BMR), calorie burns, and load targets.
              </p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Biological Sex
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      gender === g
                        ? 'bg-accent text-black border-accent shadow-sm'
                        : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Height & Weight Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={100}
                max={250}
              />
              <Input
                label="Current Weight (kg)"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                min={30}
                max={250}
              />
              <Input
                label="Target Weight (kg)"
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                min={30}
                max={250}
              />
            </div>

            {/* Live BMI Card */}
            <div className="p-4 rounded-xl bg-main border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase font-semibold">Calculated BMI</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-accent">{bmi}</span>
                  <span className="text-xs font-medium text-text-secondary">({bmiCategory})</span>
                </div>
              </div>
              <div className="text-right text-xs text-text-muted">
                <p>Weight delta to target:</p>
                <p className="font-bold text-text-primary text-sm mt-0.5">
                  {(targetWeight - weight > 0 ? '+' : '') + (targetWeight - weight).toFixed(1)} kg
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Nutrition & Allergies */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                Dietary Strategy & Allergies
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Customize your meal plans, recipe suggestions, and macro splits.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Preferred Dietary Protocol
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DIETARY_PREFERENCES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiet(d)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      diet === d
                        ? 'bg-accent/15 border-accent text-text-primary font-bold shadow-[0_0_12px_rgba(198,241,53,0.1)]'
                        : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Allergies & Sensitivities (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGIES.map((allergy) => {
                  const active = allergies.includes(allergy);
                  return (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-status-declined/20 border-status-declined text-status-declined'
                          : 'bg-main border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {allergy}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: AI Plan Preview */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 text-accent mx-auto flex items-center justify-center">
                <Zap className="w-6 h-6 fill-accent" />
              </div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                Profile Calibrated & Ready!
              </h2>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Here is your AI baseline target calculated from your biometrics and athletic goals.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-main border border-border text-center">
                <p className="text-[11px] text-text-muted uppercase font-semibold">Daily Energy</p>
                <p className="text-xl font-black text-accent mt-1">{estimatedCalories}</p>
                <p className="text-[10px] text-text-secondary">kcal / day</p>
              </div>
              <div className="p-4 rounded-xl bg-main border border-border text-center">
                <p className="text-[11px] text-text-muted uppercase font-semibold">Protein Target</p>
                <p className="text-xl font-black text-text-primary mt-1">{Math.round(weight * 2.2)}g</p>
                <p className="text-[10px] text-text-secondary">~2.2g per kg</p>
              </div>
              <div className="p-4 rounded-xl bg-main border border-border text-center col-span-2 sm:col-span-1">
                <p className="text-[11px] text-text-muted uppercase font-semibold">Hydration</p>
                <p className="text-xl font-black text-text-primary mt-1">3.5 L</p>
                <p className="text-[10px] text-text-secondary">Daily intake</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/10 border border-accent/25 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-accent">SmartCoach AI Sync Activated</p>
                <p className="text-text-secondary mt-0.5 leading-relaxed">
                  Your customized workout schedule, macro distribution, and coach recommendations are now synced across all devices.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="secondary" size="md" onClick={handlePrev}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="accent-glow"
            size="md"
            loading={isSubmitting}
            onClick={handleNext}
          >
            {step === totalSteps ? (
              <>
                <span>Launch Athlete Dashboard</span>
                <Sparkles className="w-4 h-4 ml-1.5" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
