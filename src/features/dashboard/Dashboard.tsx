import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Flame,
  Dumbbell,
  Play,
  Droplets,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  Utensils,
  Bot,
  Plus,
  Activity,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { MobileHealthSyncModal, type MobileHealthData } from '../mobile/MobileHealthSyncModal';
import { useAuthStore } from '../../stores/authStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { FreeWorkout, CoachProfile } from '../../types';
import api from '../../lib/axios';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startWorkout } = useWorkoutStore();

  const [waterIntake, setWaterIntake] = useState(() => {
    const saved = localStorage.getItem('daily_water_intake');
    return saved ? Number(saved) : 2250;
  });
  const waterTarget = user?.dailyWaterTarget || 3500;

  const [consumedCalories, setConsumedCalories] = useState(() => {
    const saved = localStorage.getItem('daily_consumed_calories');
    return saved ? Number(saved) : 1940;
  });
  const calorieTarget = user?.dailyCalorieTarget || 2750;

  const [todaysWorkout, setTodaysWorkout] = useState<FreeWorkout | null>(null);
  const [assignedCoach, setAssignedCoach] = useState<CoachProfile | null>(null);
  const [stats, setStats] = useState<{ totalWorkouts: number; completedWorkouts: number; currentStreak: number }>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isHealthSyncOpen, setIsHealthSyncOpen] = useState(false);
  const [healthData, setHealthData] = useState<MobileHealthData | null>(() => {
    const saved = localStorage.getItem('apex_mobile_health_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [workoutsRes, coachesRes, statsRes] = await Promise.allSettled([
          api.get('/workouts'),
          api.get('/coach-profile'),
          api.get('/progress-logs/stats'),
        ]);

        if (workoutsRes.status === 'fulfilled' && Array.isArray(workoutsRes.value.data) && workoutsRes.value.data.length > 0) {
          const customToday = localStorage.getItem('smartcoach_todays_workout');
          if (customToday) {
            try {
              setTodaysWorkout(JSON.parse(customToday));
            } catch {
              setTodaysWorkout(workoutsRes.value.data[0]);
            }
          } else {
            setTodaysWorkout(workoutsRes.value.data[0]);
          }
        }

        if (coachesRes.status === 'fulfilled' && Array.isArray(coachesRes.value.data) && coachesRes.value.data.length > 0) {
          setAssignedCoach(coachesRes.value.data[0]);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.data) {
          setStats(statsRes.value.data);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const addWater = (amount: number) => {
    setWaterIntake((prev) => {
      const next = Math.max(0, Math.min(6000, prev + amount));
      localStorage.setItem('daily_water_intake', String(next));
      return next;
    });
  };

  const handleStartTodayWorkout = () => {
    if (todaysWorkout) {
      startWorkout(todaysWorkout);
      navigate('/workouts/play');
    } else {
      navigate('/workouts');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-card via-card-hover to-card border border-border p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" size="sm">
                <Flame className="w-3 h-3 mr-1 fill-accent" />
                {stats.currentStreak > 0 ? `${stats.currentStreak}-Day Consistency Streak` : 'Active Training Plan'}
              </Badge>
              <Badge variant="neutral" size="sm">
                Track: {user?.fitnessGoal || 'Gain Muscle'}
              </Badge>
              {healthData && (
                <button
                  type="button"
                  onClick={() => setIsHealthSyncOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-approved/15 text-status-approved border border-status-approved/30 hover:bg-status-approved/25 transition-all cursor-pointer"
                  title="View Mobile Health Telemetry"
                >
                  <Activity className="w-3.5 h-3.5 text-status-approved" />
                  <span>
                    {healthData.provider === 'apple' ? 'Apple Health' : 'Health Connect'}: {healthData.steps.toLocaleString()} steps • {healthData.activeCalories} kcal
                  </span>
                </button>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
              Ready to crush today, {user?.firstName || 'Athlete'}?
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed">
              Your AI training protocol has scheduled an athletic session calibrated to your current recovery phase today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="accent-glow"
              size="lg"
              onClick={handleStartTodayWorkout}
              className="gap-2 shadow-[0_0_25px_rgba(198,241,53,0.3)]"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Start Scheduled Routine</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsHealthSyncOpen(true)}
              className="gap-2 border-accent/40 text-text-primary hover:border-accent hover:bg-accent/10"
            >
              <Activity className="w-4 h-4 text-accent" />
              <span>Sync HealthKit / Health Connect</span>
            </Button>

            <Link to="/ai/chat">
              <Button variant="secondary" size="lg" className="gap-2">
                <Bot className="w-4 h-4 text-accent" />
                <span>Ask AI Coach</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Weight"
          value={`${user?.weight || 79.5} kg`}
          subtitle={`Target: ${user?.targetWeight || 83.0} kg`}
          change={+1.4}
          changeLabel="muscle gained this month"
          icon={<TrendingUp className="w-5 h-5" />}
        />

        <StatCard
          title="Completed Workouts"
          value={`${stats.completedWorkouts} Sessions`}
          subtitle={`${stats.totalWorkouts} total workouts logged`}
          change={+20}
          changeLabel="vs target"
          icon={<Dumbbell className="w-5 h-5" />}
        />

        <StatCard
          title="Active Streak"
          value={`${stats.currentStreak} Days`}
          subtitle="Consistency score"
          change={+6.6}
          changeLabel="above average"
          icon={<Flame className="w-5 h-5" />}
        />

        <StatCard
          title="Coach Adherence"
          value="96%"
          subtitle="Rank: Tier 1 Athlete"
          change={+4}
          changeLabel="top 5% on platform"
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Main Grid: Today's Workout + Nutrition & Hydration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout Featured Player Card (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border overflow-hidden relative group">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/30">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Today's Workout</h3>
                  <p className="text-xs text-text-muted">Prescribed by AI Coach & Certified CSCS</p>
                </div>
              </div>
              <Badge variant="accent">
                {todaysWorkout ? `${todaysWorkout.duration} mins • ${todaysWorkout.difficulty}` : 'Loading routine...'}
              </Badge>
            </div>

            {todaysWorkout ? (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-1 rounded-xl overflow-hidden border border-border relative aspect-video sm:aspect-auto">
                  <img
                    src={todaysWorkout.thumbnailUrl || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600'}
                    alt={todaysWorkout.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-accent/90 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <h4 className="text-lg font-bold text-text-primary">{todaysWorkout.title}</h4>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {todaysWorkout.description}
                  </p>

                  {/* Exercise List preview */}
                  <div className="space-y-1.5 pt-1">
                    {todaysWorkout.exercises?.slice(0, 3).map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-main border border-border/60"
                      >
                        <span className="font-semibold text-text-primary flex items-center gap-2">
                          <span className="text-accent text-[11px] font-mono">0{idx + 1}</span>
                          {ex.name}
                        </span>
                        <span className="text-text-muted">
                          {ex.sets} sets × {ex.reps} reps
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleStartTodayWorkout}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 fill-black mr-2" /> Launch Workout Player
                    </Button>
                    <Link to="/workouts">
                      <Button variant="secondary" size="md">
                        Browse All
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-text-muted">Loading routine from workout database...</p>
                <Link to="/workouts">
                  <Button variant="secondary" size="sm">Browse Workout Catalog</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* AI Coach Quick Consult Prompt */}
          <Card className="p-6 bg-gradient-to-r from-card to-main border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>APEX AI Performance Assistant</span>
                  <Badge variant="accent" size="sm">Online</Badge>
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Ask about recovery, substitutions, pre-workout nutrition, or exercise mechanics.
                </p>
              </div>
            </div>
            <Link to="/ai/chat" className="shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <span>Chat with AI</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Right Column: Nutrition & Hydration Trackers */}
        <div className="space-y-6">
          {/* Calorie & Macro Target Card */}
          <Card className="p-6 border-border space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-text-primary">Daily Nutrition & Macros</h3>
              </div>
              <Link to="/nutrition" className="text-xs text-accent hover:underline">
                Log Food
              </Link>
            </div>

            {/* Calorie Progress Ring/Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Energy Consumed</span>
                <span className="font-bold text-text-primary">
                  {consumedCalories} / {calorieTarget} kcal
                </span>
              </div>
              <ProgressBar
                value={consumedCalories}
                max={calorieTarget}
                variant="accent"
                height="md"
              />
              <p className="text-[11px] text-right text-text-muted">
                {consumedCalories > calorieTarget
                  ? `+${consumedCalories - calorieTarget} kcal surplus`
                  : `${calorieTarget - consumedCalories} kcal remaining`}
              </p>
            </div>

            {/* Individual Macro Bars */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <ProgressBar
                label="Protein (Target: 190g)"
                value={165}
                max={190}
                valueDisplay="165g / 190g (87%)"
                variant="accent"
                height="sm"
              />
              <ProgressBar
                label="Carbohydrates (Target: 260g)"
                value={180}
                max={260}
                valueDisplay="180g / 260g (69%)"
                variant="approved"
                height="sm"
              />
              <ProgressBar
                label="Healthy Fats (Target: 70g)"
                value={52}
                max={70}
                valueDisplay="52g / 70g (74%)"
                variant="warning"
                height="sm"
              />
            </div>
          </Card>

          {/* Hydration Tracker Card */}
          <Card className="p-6 border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-text-primary">Hydration Intake</h3>
              </div>
              <span className="text-xs font-bold text-cyan-400">
                {Math.round((waterIntake / waterTarget) * 100)}%
              </span>
            </div>

            <ProgressBar
              value={waterIntake}
              max={waterTarget}
              valueDisplay={`${(waterIntake / 1000).toFixed(1)}L / ${(waterTarget / 1000).toFixed(1)}L`}
              variant="approved"
              height="md"
            />

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={() => addWater(-250)}
                className="py-2 px-1 rounded-xl bg-main border border-border hover:border-status-declined/50 text-text-muted hover:text-status-declined text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                title="Undo 250ml"
              >
                -250
              </button>
              <button
                onClick={() => addWater(250)}
                className="py-2 px-1 rounded-xl bg-main border border-border hover:border-cyan-400/50 text-text-primary hover:text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 250
              </button>
              <button
                onClick={() => addWater(500)}
                className="py-2 px-1 rounded-xl bg-main border border-border hover:border-cyan-400/50 text-text-primary hover:text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 500
              </button>
              <button
                onClick={() => addWater(750)}
                className="py-2 px-1 rounded-xl bg-main border border-border hover:border-cyan-400/50 text-text-primary hover:text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 750
              </button>
            </div>
          </Card>

          {/* Assigned Coach Quick Connect */}
          <Card className="p-6 border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Assigned Head Coach</h3>
              <Badge variant="approved" size="sm">Active</Badge>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={
                  assignedCoach?.avatarUrl ||
                  'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400'
                }
                alt="Coach"
                className="w-11 h-11 rounded-xl object-cover border border-border"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-text-primary truncate">
                  {typeof assignedCoach?.userId === 'object' && assignedCoach.userId
                    ? `Coach ${(assignedCoach.userId as any).firstName} ${(assignedCoach.userId as any).lastName}`
                    : 'Coach Elena Rostova'}
                </h4>
                <p className="text-[11px] text-text-muted truncate">
                  {assignedCoach?.specialties?.join(' • ') || 'Olympic & Hypertrophy Specialist'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link to="/chat" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Message Coach
                </Button>
              </Link>
              <Link to="/coaches" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Schedule Call
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <MobileHealthSyncModal
        isOpen={isHealthSyncOpen}
        onClose={() => setIsHealthSyncOpen(false)}
        onSyncComplete={(data) => setHealthData(data)}
      />
    </div>
  );
}
