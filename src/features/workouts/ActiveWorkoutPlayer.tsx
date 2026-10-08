import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Award,
  AlertCircle,
  X,
  Volume2,
  Video,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useAuthStore } from '../../stores/authStore';
import { formatTimer } from '../../lib/utils';
import api from '../../lib/axios';
import { FreeWorkout } from '../../types';
import { VisionRepCounterModal } from '../vision/VisionRepCounterModal';

export function ActiveWorkoutPlayer() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activeWorkout,
    currentExerciseIndex,
    completedSetsMap,
    elapsedSeconds,
    restTimerSeconds,
    restTimerMax,
    isRestTimerRunning,
    startWorkout,
    finishWorkout,
    cancelWorkout,
    nextExercise,
    prevExercise,
    selectExercise,
    completeSet,
    uncompleteSet,
    startRestTimer,
    skipRestTimer,
    addRestTimerSeconds,
    syncTimers,
  } = useWorkoutStore();

  const [isLoadingWorkout, setIsLoadingWorkout] = useState(!activeWorkout);
  const [exerciseLoads, setExerciseLoads] = useState<Record<string, { weight: number; reps: number }>>({});
  const [sessionVolume, setSessionVolume] = useState<number>(0);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // If no active workout, load the first available workout from DB catalog
  useEffect(() => {
    if (!activeWorkout) {
      setIsLoadingWorkout(true);
      api
        .get<FreeWorkout[]>('/workouts')
        .then(({ data }) => {
          if (Array.isArray(data) && data.length > 0) {
            startWorkout(data[0]);
          } else {
            navigate('/workouts');
          }
        })
        .catch(() => {
          navigate('/workouts');
        })
        .finally(() => {
          setIsLoadingWorkout(false);
        });
    }
  }, [activeWorkout, startWorkout, navigate]);

  // Timers interval with background tab drift protection
  useEffect(() => {
    syncTimers();

    const interval = setInterval(() => {
      syncTimers();
    }, 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncTimers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncTimers);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncTimers);
    };
  }, [syncTimers]);

  // Modals
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{
    duration: number;
    calories: number;
    title: string;
  } | null>(null);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);

  const workout = activeWorkout;
  const exercises = workout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex] || exercises[0];

  const totalExercises = exercises.length;
  const currentSetsDone = currentExercise ? completedSetsMap[currentExercise.id] || 0 : 0;
  const totalSetsForCurrent = currentExercise?.sets || 4;

  const handleSetToggle = (setIndex: number) => {
    if (!currentExercise) return;
    if (setIndex < currentSetsDone) {
      uncompleteSet(currentExercise.id);
    } else {
      completeSet(currentExercise.id, totalSetsForCurrent, currentExercise.restSeconds || 60);
    }
  };

  const handleSyncVisionReps = (countedReps: number, markSetComplete?: boolean) => {
    if (!currentExercise) return;

    setExerciseLoads((prev) => ({
      ...prev,
      [currentExercise.id]: {
        weight: prev[currentExercise.id]?.weight ?? currentExercise.weight ?? 0,
        reps: countedReps,
      },
    }));

    if (markSetComplete || countedReps >= (currentExercise.reps || 10)) {
      completeSet(currentExercise.id, totalSetsForCurrent, currentExercise.restSeconds || 60);
      toast.success(
        `Set ${Math.min(totalSetsForCurrent, currentSetsDone + 1)} recorded! ${countedReps} reps verified by MediaPipe AI.`
      );
    } else {
      toast.success(`Logged ${countedReps} reps for Set ${currentSetsDone + 1}.`);
    }
  };

  const handleFinishSession = async () => {
    if (!workout) return;

    // Calculate real total tonnage / volume from completed sets
    let totalVolume = 0;
    const completedExercisesPayload = exercises.map((ex) => {
      const setsDone = completedSetsMap[ex.id] || 0;
      const exWeight = exerciseLoads[ex.id]?.weight ?? ex.weight ?? 0;
      const exReps = exerciseLoads[ex.id]?.reps ?? ex.reps ?? 10;
      const vol = setsDone * exReps * exWeight;
      totalVolume += vol;
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: setsDone,
        reps: exReps,
        weight: exWeight,
        rpe: 8.0,
        completed: setsDone >= ex.sets,
      };
    });

    setSessionVolume(totalVolume);

    const summary = finishWorkout();
    setSessionSummary(summary);
    setShowFinishModal(true);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#C6F135', '#22C55E', '#FFFFFF', '#F59E0B'],
    });

    // Persist workout session sets and tonnage directly to MongoDB
    try {
      setIsSubmittingLog(true);
      await api.post('/progress-logs/workout-session', {
        workoutId: workout._id,
        workoutTitle: workout.title,
        durationMinutes: summary.duration,
        caloriesBurned: summary.calories,
        totalVolume,
        completedExercises: completedExercisesPayload,
        date: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Workout progress logged locally, failed to sync with backend:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  if (isLoadingWorkout || !currentExercise || !workout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-text-muted">Loading athletic routine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/workouts')}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Workout Catalog</span>
        </button>
      </div>

      {/* Top Session Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 fill-accent" />
          </div>
          <div>
            <h1 className="text-base font-black text-text-primary truncate max-w-xs sm:max-w-md">
              {workout.title}
            </h1>
            <p className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
              <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
              <span>•</span>
              <span className="text-accent font-semibold">{currentExercise.targetMuscle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Elapsed Session Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-main border border-border font-mono text-sm font-bold text-text-primary">
            <Clock className="w-4 h-4 text-accent" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <Button
            variant="accent-glow"
            size="sm"
            onClick={handleFinishSession}
            className="text-xs font-bold"
          >
            <Check className="w-4 h-4 mr-1" />
            <span>Finish Workout</span>
          </Button>

          <button
            onClick={() => {
              if (confirm('Cancel active workout session? Progress will be saved.')) {
                cancelWorkout();
                navigate('/workouts');
              }
            }}
            className="p-2 text-text-muted hover:text-status-declined rounded-xl hover:bg-main cursor-pointer"
            title="Cancel Workout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rest Timer Countdown Banner (Active when resting) */}
      {isRestTimerRunning && restTimerSeconds > 0 && (
        <Card className="p-4 bg-gradient-to-r from-accent/15 via-card to-card border-accent/50 shadow-[0_0_25px_rgba(198,241,53,0.15)] animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent text-black font-black text-xl flex items-center justify-center shadow-lg font-mono">
                {restTimerSeconds}s
              </div>
              <div>
                <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
                  <span>REST PERIOD ACTIVE</span>
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                </h4>
                <p className="text-xs text-text-muted">
                  Deep nasal breathing. Prepare your load for Set {Math.min(totalSetsForCurrent, currentSetsDone + 1)}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addRestTimerSeconds(30)}
                className="text-xs"
              >
                +30s
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={skipRestTimer}
                className="text-xs"
              >
                Skip Rest & Lift
              </Button>
            </div>
          </div>

          <div className="w-full bg-main h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(restTimerSeconds / restTimerMax) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* Current Movement Hero Card */}
      <Card className="p-6 border-border space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="accent" size="sm">
                Movement #{currentExerciseIndex + 1}
              </Badge>
              <Badge variant="neutral" size="sm">
                {currentExercise.targetMuscle}
              </Badge>
            </div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              {currentExercise.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="accent-glow"
              size="sm"
              onClick={() => setShowVisionModal(true)}
              className="gap-1.5 text-xs font-black shadow-[0_0_15px_rgba(198,241,53,0.25)]"
            >
              <Camera className="w-3.5 h-3.5 fill-black/20" />
              <span>Launch AI Camera Coach (MediaPipe)</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowVideoModal(true)}
              className="gap-1.5 text-xs"
            >
              <Video className="w-3.5 h-3.5 text-accent" />
              <span>Form Video</span>
            </Button>
          </div>
        </div>

        {/* On-Device MediaPipe CV Rep Counter Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent/15 via-card to-card border border-accent/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(198,241,53,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-black font-black flex items-center justify-center shadow-md shrink-0">
              <Camera className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-text-primary">
                  Automated Edge CV Rep Counting
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/40">
                  MediaPipe Pose
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Track joint inflection angles & auto-log working reps hands-free with 100% on-device WebAssembly.
              </p>
            </div>
          </div>
          <Button
            variant="accent-glow"
            size="sm"
            onClick={() => setShowVisionModal(true)}
            className="text-xs font-black shrink-0 self-start sm:self-auto gap-1.5 shadow-md"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open Camera Coach</span>
          </Button>
        </div>

        {/* Coaching Cues */}
        {currentExercise.instructions && currentExercise.instructions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-main border border-border/70 space-y-1.5">
            <p className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Biomechanics Execution Cues:
            </p>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              {currentExercise.instructions.map((cue, idx) => (
                <li key={idx}>{cue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sets Logging Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider px-2">
            <span>Set Breakdown</span>
            <span>Reps & Load</span>
            <span>Completed</span>
          </div>

          <div className="space-y-2">
            {Array.from({ length: totalSetsForCurrent }).map((_, setIdx) => {
              const isDone = setIdx < currentSetsDone;
              return (
                <div
                  key={setIdx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isDone
                      ? 'bg-accent/10 border-accent/40 shadow-[0_0_12px_rgba(198,241,53,0.08)]'
                      : 'bg-main border-border/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center font-mono ${
                        isDone ? 'bg-accent text-black' : 'bg-card text-text-muted border border-border'
                      }`}
                    >
                      {setIdx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-text-primary">
                        Target: {currentExercise.reps} Reps
                      </span>
                      <p className="text-[11px] text-text-muted">RPE 8.0 • Working Set</p>
                    </div>
                  </div>

                  {/* Weight & Reps display */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-semibold text-text-primary">
                      {currentExercise.weight || 30} kg
                    </span>
                    <span className="text-text-muted">×</span>
                    <span className="px-2.5 py-1 rounded-lg bg-card border border-border font-semibold text-text-primary">
                      {currentExercise.reps} reps
                    </span>
                  </div>

                  {/* Completion Toggle */}
                  <button
                    onClick={() => handleSetToggle(setIdx)}
                    aria-label={`Toggle set ${setIdx + 1} completion`}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isDone
                        ? 'bg-accent border-accent text-black shadow-md'
                        : 'bg-card border-border text-text-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    <Check className="w-5 h-5 font-black" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exercise Switcher Navigation */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            onClick={prevExercise}
            disabled={currentExerciseIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous Movement
          </Button>

          <span className="text-xs font-semibold text-text-muted">
            {currentExerciseIndex + 1} / {totalExercises}
          </span>

          <Button
            variant="primary"
            size="md"
            onClick={nextExercise}
            disabled={currentExerciseIndex === totalExercises - 1}
          >
            <span>Next Movement</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Movement List Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {exercises.map((ex, idx) => {
          const isCurrent = idx === currentExerciseIndex;
          const isDone = (completedSetsMap[ex.id] || 0) >= ex.sets;

          return (
            <button
              key={ex.id}
              onClick={() => selectExercise(idx)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-accent/15 border-accent text-text-primary shadow-sm'
                  : 'bg-card border-border text-text-secondary hover:bg-card-hover'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">0{idx + 1}</span>
                {isDone && <Check className="w-3.5 h-3.5 text-accent" />}
              </div>
              <p className="text-xs font-bold truncate text-text-primary">{ex.name}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {completedSetsMap[ex.id] || 0}/{ex.sets} sets
              </p>
            </button>
          );
        })}
      </div>

      {/* Video Demonstration Modal */}
      <Modal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title={`${currentExercise.name} - Form & Mechanics`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-border">
            <video
              src={currentExercise.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-xs text-text-secondary leading-relaxed">
            Focus on maintaining a rigid lumbar posture. Initiate movement from the target muscle group and pause at the active peak contraction.
          </div>
        </div>
      </Modal>

      {/* Finish Workout Celebration Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => {
          setShowFinishModal(false);
          navigate('/dashboard');
        }}
        title="Workout Crushed! ⚡"
        maxWidth="md"
      >
        <div className="text-center space-y-5 py-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center shadow-[0_0_30px_rgba(198,241,53,0.3)]">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-text-primary">
              Outstanding Effort, {user?.firstName || 'Athlete'}!
            </h3>
            <p className="text-xs text-text-muted mt-1">
              {isSubmittingLog
                ? 'Syncing training metrics to MongoDB database...'
                : 'Your training session data has been synced to your athlete progress charts.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-main border border-border">
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Duration</p>
              <p className="text-lg font-black text-text-primary mt-0.5">
                {sessionSummary?.duration} min
              </p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Burned</p>
              <p className="text-lg font-black text-accent mt-0.5">
                {sessionSummary?.calories} kcal
              </p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold">Volume</p>
              <p className="text-lg font-black text-status-approved mt-0.5">
                {sessionVolume > 0 ? `${sessionVolume.toLocaleString()} kg` : 'Bodyweight'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="accent-glow"
              size="lg"
              className="flex-1"
              onClick={() => {
                setShowFinishModal(false);
                navigate('/progress');
              }}
            >
              View Progress Charts
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowFinishModal(false);
                navigate('/dashboard');
              }}
            >
              Return Home
            </Button>
          </div>
        </div>
      </Modal>

      {/* Vision Rep Counter Modal (MediaPipe Edge CV) */}
      <VisionRepCounterModal
        isOpen={showVisionModal}
        onClose={() => setShowVisionModal(false)}
        exerciseName={currentExercise.name}
        targetReps={currentExercise.reps || 10}
        initialReps={exerciseLoads[currentExercise.id]?.reps || 0}
        onSyncReps={handleSyncVisionReps}
      />
    </div>
  );
}
