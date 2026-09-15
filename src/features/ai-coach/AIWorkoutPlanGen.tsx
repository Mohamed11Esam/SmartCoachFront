import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Dumbbell,
  Clock,
  Check,
  Play,
  BookmarkPlus,
  ArrowRight,
  Flame,
  Zap,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useWorkoutStore } from '../../stores/workoutStore';
import { FreeWorkout, Exercise } from '../../types';
import {
  FITNESS_LEVELS,
  FITNESS_GOALS,
  EQUIPMENT_OPTIONS,
  TARGET_MUSCLE_GROUPS,
  AI_SERVICE_URL,
} from '../../config/constants';
import api from '../../lib/axios';
import axios from 'axios';

export function AIWorkoutPlanGen() {
  const navigate = useNavigate();
  const { startWorkout, toggleSaveWorkout } = useWorkoutStore();

  const handleSetAsTodayRoutine = (workout: FreeWorkout) => {
    localStorage.setItem('smartcoach_todays_workout', JSON.stringify(workout));
    toast.success("Set as Today's Scheduled Routine on Dashboard!");
  };

  // Form State
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [goals, setGoals] = useState<string[]>(['muscle_gain']);
  const [duration, setDuration] = useState<number>(45);
  const [equipment, setEquipment] = useState<string[]>(['Full Gym', 'Dumbbells']);
  const [targetMuscles, setTargetMuscles] = useState<string[]>(['Chest', 'Back', 'Shoulders']);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<FreeWorkout | null>(null);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((g) => g !== id) : prev) : [...prev, id]
    );
  };

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? (prev.length > 1 ? prev.filter((e) => e !== item) : prev) : [...prev, item]
    );
  };

  const toggleMuscle = (muscle: string) => {
    setTargetMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const payload = {
      fitnessLevel: level,
      goals,
      duration,
      equipment,
      targetMuscles,
    };

    try {
      // 1. Try Backend /ai/workout-plan
      let routineData: any = null;
      try {
        const res = await api.post('/ai/workout-plan', payload, { timeout: 1200 });
        routineData = res.data;
      } catch {
        // 2. Try direct AI service /rag/workout-plan
        try {
          const directRes = await axios.post(`${AI_SERVICE_URL}/rag/workout-plan`, payload, { timeout: 1200 });
          routineData = directRes.data;
        } catch {
          // 3. Fallback AI routine generator
          routineData = buildFallbackRoutine(level, duration, targetMuscles);
        }
      }

      const workoutObj: FreeWorkout = {
        _id: 'gen_' + Date.now(),
        title: routineData.title || `AI Tailored ${targetMuscles.slice(0, 2).join(' & ')} Blast`,
        description:
          routineData.description ||
          `Optimized high-tension session for ${level} athletes designed to stimulate peak hypertrophy within a ${duration}-minute window.`,
        difficulty: level,
        duration: duration,
        calories: Math.round(duration * 8.5),
        category: 'Hypertrophy',
        tags: targetMuscles,
        thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600',
        exercises: routineData.exercises || buildExercisesForMuscles(targetMuscles),
      };

      setGeneratedWorkout(workoutObj);
    } catch (err) {
      console.error('Workout generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayRoutine = () => {
    if (!generatedWorkout) return;
    startWorkout(generatedWorkout);
    navigate('/workouts/play');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div>
        <button
          onClick={() => navigate('/ai/chat')}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to APEX AI Hub</span>
        </button>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Sparkles className="w-3 h-3 mr-1" /> APEX Performance Engine
          </Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          AI Workout Routine Generator
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl">
          Specify your available equipment, target muscle groups, and duration. SmartCoach AI generates an individualized routine with exact sets, reps, and RPE loads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border-border space-y-5 shadow-xl">
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Experience Level */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Training Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FITNESS_LEVELS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLevel(item.id as any)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        level === item.id
                          ? 'bg-accent text-black border-accent'
                          : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Duration Slider / Chips */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Duration
                  </label>
                  <span className="text-xs font-bold text-accent">{duration} Minutes</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 75].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        duration === d
                          ? 'bg-accent text-black border-accent'
                          : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Equipment */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Available Equipment
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const isSelected = equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'bg-main border-border text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Muscles */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Target Muscle Groups
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TARGET_MUSCLE_GROUPS.map((m) => {
                    const isSelected = targetMuscles.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMuscle(m)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-accent/20 border-accent text-accent font-semibold'
                            : 'bg-main border-border text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                variant="accent-glow"
                size="lg"
                loading={isGenerating}
                className="w-full mt-4"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Generate Custom Routine</span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Area: Generated Workout Result */}
        <div className="lg:col-span-7">
          {generatedWorkout ? (
            <div className="space-y-5 animate-fadeIn">
              <Card className="p-6 border-accent/40 shadow-2xl relative overflow-hidden">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/80">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="accent" size="sm">
                        AI Generated Protocol
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {generatedWorkout.difficulty}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {generatedWorkout.title}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {generatedWorkout.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-text-muted">Estimated</span>
                    <p className="text-lg font-black text-accent">{generatedWorkout.calories} kcal</p>
                  </div>
                </div>

                {/* Exercises list */}
                <div className="mt-5 space-y-3">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Prescribed Exercise Progression ({generatedWorkout.exercises?.length} Movements)
                  </h3>

                  {generatedWorkout.exercises?.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl bg-main border border-border/80 flex items-start justify-between gap-3 hover:border-border-light transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-card border border-border text-accent font-mono text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">{ex.name}</h4>
                          <p className="text-xs text-text-muted mt-0.5">
                            Target: <span className="text-text-secondary">{ex.targetMuscle}</span>
                          </p>
                          {ex.instructions && (
                            <ul className="mt-2 space-y-0.5 text-[11px] text-text-muted list-disc list-inside">
                              {ex.instructions.map((inst, i) => (
                                <li key={i}>{inst}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-text-primary">
                          {ex.sets} Sets × {ex.reps} Reps
                        </div>
                        <div className="text-[11px] text-accent mt-0.5">
                          {ex.restSeconds}s Rest
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="accent-glow"
                    size="lg"
                    onClick={handlePlayRoutine}
                    className="w-full sm:flex-1"
                  >
                    <Play className="w-4 h-4 fill-black mr-2" /> Launch Workout Player
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleSetAsTodayRoutine(generatedWorkout)}
                    className="w-full sm:w-auto"
                  >
                    <Calendar className="w-4 h-4 mr-1.5 text-accent" /> Set as Today's Routine
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      toggleSaveWorkout(generatedWorkout._id);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <BookmarkPlus className="w-4 h-4 mr-2" /> Save to Library
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center border-dashed border-border/80">
              <div className="w-16 h-16 rounded-2xl bg-main border border-border flex items-center justify-center text-accent mb-4 shadow-[0_0_20px_rgba(198,241,53,0.15)]">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Configure Your Routine</h3>
              <p className="text-xs text-text-muted max-w-sm mt-1 leading-relaxed">
                Select your target muscle groups and duration on the left, then click Generate to construct an exercise science routine.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function buildFallbackRoutine(level: string, duration: number, muscles: string[]) {
  return {
    title: `${muscles.join(' & ')} Mechanical Overload`,
    description: `Structured ${level} routine designed for optimal stimulus-to-fatigue ratio hitting ${muscles.join(', ')} with progressive load.`,
    exercises: buildExercisesForMuscles(muscles),
  };
}

function buildExercisesForMuscles(muscles: string[]): Exercise[] {
  const pool: Record<string, Exercise[]> = {
    Chest: [
      {
        id: 'ex_c1',
        name: 'Incline Dumbbell Press',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        targetMuscle: 'Upper Pectorals',
        instructions: ['30-degree incline', 'Pause 1s at deep chest stretch'],
      },
      {
        id: 'ex_c2',
        name: 'Cable Chest Flyes',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        targetMuscle: 'Sternal Pectorals',
        instructions: ['Drive hands across midline for peak squeeze'],
      },
    ],
    Back: [
      {
        id: 'ex_b1',
        name: 'Chest-Supported T-Bar Row',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        targetMuscle: 'Mid-Back & Rhomboids',
        instructions: ['Lead with elbows and avoid lumbar arching'],
      },
      {
        id: 'ex_b2',
        name: 'Neutral Grip Lat Pulldown',
        sets: 3,
        reps: 12,
        restSeconds: 75,
        targetMuscle: 'Latissimus Dorsi',
        instructions: ['Slight lean back', 'Depress shoulder blades first'],
      },
    ],
    Shoulders: [
      {
        id: 'ex_s1',
        name: 'Standing Dumbbell Overhead Press',
        sets: 4,
        reps: 8,
        restSeconds: 90,
        targetMuscle: 'Anterior & Lateral Deltoids',
        instructions: ['Lock glutes and core to avoid backward lean'],
      },
      {
        id: 'ex_s2',
        name: 'Incline Bench Lateral Raises',
        sets: 4,
        reps: 15,
        restSeconds: 60,
        targetMuscle: 'Lateral Deltoids',
        instructions: ['Raise in scapular plane, not strictly to the side'],
      },
    ],
    Quads: [
      {
        id: 'ex_q1',
        name: 'Barbell Back Squat',
        sets: 4,
        reps: 8,
        restSeconds: 120,
        targetMuscle: 'Quadriceps & Glutes',
        instructions: ['Drive knees out in line with toes', 'Full depth'],
      },
      {
        id: 'ex_q2',
        name: 'Leg Extension Mechanical Drop Set',
        sets: 3,
        reps: 15,
        restSeconds: 60,
        targetMuscle: 'Rectus Femoris',
        instructions: ['2s hold at full knee lock-out'],
      },
    ],
  };

  const chosen: Exercise[] = [];
  muscles.forEach((m) => {
    if (pool[m]) {
      chosen.push(...pool[m]);
    }
  });

  if (chosen.length === 0) {
    return [
      {
        id: 'gen_def_1',
        name: 'Barbell Romanian Deadlift',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        targetMuscle: 'Posterior Chain',
      },
      {
        id: 'gen_def_2',
        name: 'Dumbbell Walking Lunges',
        sets: 3,
        reps: 12,
        restSeconds: 75,
        targetMuscle: 'Quads & Glutes',
      },
    ];
  }

  return chosen.slice(0, 5);
}
