export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://exact-gwenette-fitglow-38dc47eb.koyeb.app';

export const AI_SERVICE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || 'https://mohamedEsam1-smartcoachai.hf.space';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'https://exact-gwenette-fitglow-38dc47eb.koyeb.app';

export const FITNESS_GOALS = [
  { id: 'muscle_gain', label: 'Gain Muscle & Hypertrophy', icon: 'Flame' },
  { id: 'weight_loss', label: 'Lose Fat & Shred', icon: 'TrendingDown' },
  { id: 'endurance', label: 'Cardio & Endurance', icon: 'Zap' },
  { id: 'maintenance', label: 'Overall Health & Longevity', icon: 'HeartPulse' },
  { id: 'strength', label: 'Powerlifting & Raw Strength', icon: 'Dumbbell' },
] as const;

export const FITNESS_LEVELS = [
  { id: 'Beginner', label: 'Beginner', desc: '< 1 year of consistent training' },
  { id: 'Intermediate', label: 'Intermediate', desc: '1 - 3 years of lifting' },
  { id: 'Advanced', label: 'Advanced', desc: '3+ years of serious training' },
] as const;

export const EQUIPMENT_OPTIONS = [
  'Full Gym',
  'Dumbbells',
  'Barbell & Plates',
  'Resistance Bands',
  'Kettlebells',
  'Bodyweight Only',
  'Cable Machine',
] as const;

export const TARGET_MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core / Abs',
] as const;

export const DIETARY_PREFERENCES = [
  'Balanced & Whole Foods',
  'High Protein Lean',
  'Ketogenic',
  'Vegetarian',
  'Vegan',
  'Paleo',
  'Mediterranean',
] as const;

export const COMMON_ALLERGIES = [
  'Gluten',
  'Dairy / Lactose',
  'Nuts / Peanuts',
  'Shellfish',
  'Soy',
  'Eggs',
] as const;

export const PRODUCT_CATEGORIES = [
  'all',
  'supplements',
  'equipment',
  'apparel',
  'accessories',
] as const;

export const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'AI Coach', path: '/ai/chat', icon: 'Bot' },
  { label: 'Workouts', path: '/workouts', icon: 'Dumbbell' },
  { label: 'Nutrition', path: '/nutrition', icon: 'Utensils' },
  { label: 'Coaches', path: '/coaches', icon: 'Users' },
  { label: 'Chat', path: '/chat', icon: 'MessageSquare' },
  { label: 'Progress', path: '/progress', icon: 'LineChart' },
  { label: 'Store', path: '/store', icon: 'ShoppingBag' },
] as const;
