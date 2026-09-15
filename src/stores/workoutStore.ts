import { create } from 'zustand';
import { FreeWorkout, Exercise } from '../types';

interface WorkoutStoreState {
  activeWorkout: FreeWorkout | null;
  currentExerciseIndex: number;
  completedSetsMap: Record<string, number>; // exerciseId -> number of sets done
  isSessionActive: boolean;
  elapsedSeconds: number;
  sessionStartTime: number | null;
  restTimerSeconds: number;
  restTimerMax: number;
  restEndTime: number | null;
  isRestTimerRunning: boolean;
  savedWorkoutIds: string[];

  // Actions
  startWorkout: (workout: FreeWorkout) => void;
  finishWorkout: () => { duration: number; calories: number; title: string };
  cancelWorkout: () => void;
  nextExercise: () => void;
  prevExercise: () => void;
  selectExercise: (index: number) => void;
  completeSet: (exerciseId: string, totalSets: number, restSeconds?: number) => void;
  uncompleteSet: (exerciseId: string) => void;
  startRestTimer: (seconds: number) => void;
  skipRestTimer: () => void;
  addRestTimerSeconds: (seconds: number) => void;
  syncTimers: () => void;
  toggleSaveWorkout: (workoutId: string) => void;
  isWorkoutSaved: (workoutId: string) => boolean;
}

const SAVED_WORKOUTS_KEY = 'smartcoach_saved_workouts';

const loadSavedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(SAVED_WORKOUTS_KEY);
    return raw ? JSON.parse(raw) : ['w_01'];
  } catch {
    return ['w_01'];
  }
};

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  activeWorkout: null,
  currentExerciseIndex: 0,
  completedSetsMap: {},
  isSessionActive: false,
  elapsedSeconds: 0,
  sessionStartTime: null,
  restTimerSeconds: 0,
  restTimerMax: 60,
  restEndTime: null,
  isRestTimerRunning: false,
  savedWorkoutIds: loadSavedIds(),

  startWorkout: (workout) => {
    const now = Date.now();
    set({
      activeWorkout: workout,
      currentExerciseIndex: 0,
      completedSetsMap: {},
      isSessionActive: true,
      sessionStartTime: now,
      elapsedSeconds: 0,
      restTimerSeconds: 0,
      restEndTime: null,
      isRestTimerRunning: false,
    });
  },

  finishWorkout: () => {
    const active = get().activeWorkout;
    const duration = Math.round(get().elapsedSeconds / 60);
    const calories = active?.calories || 350;
    const title = active?.title || 'Workout Session';

    set({
      activeWorkout: null,
      isSessionActive: false,
      sessionStartTime: null,
      elapsedSeconds: 0,
      restTimerSeconds: 0,
      restEndTime: null,
      isRestTimerRunning: false,
    });

    return { duration: duration || 1, calories, title };
  },

  cancelWorkout: () => {
    set({
      activeWorkout: null,
      isSessionActive: false,
      sessionStartTime: null,
      elapsedSeconds: 0,
      restTimerSeconds: 0,
      restEndTime: null,
      isRestTimerRunning: false,
    });
  },

  nextExercise: () => {
    const { activeWorkout, currentExerciseIndex } = get();
    if (!activeWorkout?.exercises) return;
    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },

  prevExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      set({ currentExerciseIndex: currentExerciseIndex - 1 });
    }
  },

  selectExercise: (index) => {
    set({ currentExerciseIndex: index });
  },

  completeSet: (exerciseId, totalSets, restSeconds = 60) => {
    const current = get().completedSetsMap[exerciseId] || 0;
    const nextCount = Math.min(totalSets, current + 1);

    set({
      completedSetsMap: {
        ...get().completedSetsMap,
        [exerciseId]: nextCount,
      },
    });

    if (restSeconds > 0) {
      get().startRestTimer(restSeconds);
    }
  },

  uncompleteSet: (exerciseId) => {
    const current = get().completedSetsMap[exerciseId] || 0;
    if (current > 0) {
      set({
        completedSetsMap: {
          ...get().completedSetsMap,
          [exerciseId]: current - 1,
        },
      });
    }
  },

  startRestTimer: (seconds) => {
    const now = Date.now();
    set({
      restTimerSeconds: seconds,
      restTimerMax: seconds,
      restEndTime: now + seconds * 1000,
      isRestTimerRunning: true,
    });
  },

  skipRestTimer: () => {
    set({
      restTimerSeconds: 0,
      restEndTime: null,
      isRestTimerRunning: false,
    });
  },

  addRestTimerSeconds: (seconds) => {
    const current = get().restTimerSeconds;
    const newSeconds = current + seconds;
    const now = Date.now();
    set({
      restTimerSeconds: newSeconds,
      restTimerMax: Math.max(get().restTimerMax, newSeconds),
      restEndTime: (get().restEndTime || now) + seconds * 1000,
    });
  },

  syncTimers: () => {
    const { isSessionActive, sessionStartTime, isRestTimerRunning, restEndTime } = get();
    const now = Date.now();

    if (isSessionActive && sessionStartTime) {
      const elapsed = Math.max(0, Math.floor((now - sessionStartTime) / 1000));
      set({ elapsedSeconds: elapsed });
    }

    if (isRestTimerRunning && restEndTime) {
      const remaining = Math.max(0, Math.ceil((restEndTime - now) / 1000));
      if (remaining <= 0) {
        set({ restTimerSeconds: 0, isRestTimerRunning: false, restEndTime: null });
      } else {
        set({ restTimerSeconds: remaining });
      }
    }
  },

  toggleSaveWorkout: (workoutId) => {
    const current = get().savedWorkoutIds;
    const exists = current.includes(workoutId);
    const updated = exists
      ? current.filter((id) => id !== workoutId)
      : [...current, workoutId];

    localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(updated));
    set({ savedWorkoutIds: updated });
  },

  isWorkoutSaved: (workoutId) => {
    return get().savedWorkoutIds.includes(workoutId);
  },
}));
