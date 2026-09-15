// User and Auth Types
export interface User {
  _id: string;
  email: string;
  role: 'Customer' | 'Coach' | 'Admin';
  firstName: string;
  lastName: string;
  isVerified?: boolean;
  phone?: string;
  photoUrl?: string;
  gender?: 'Male' | 'Female' | 'Other';
  height?: number; // cm
  weight?: number; // kg
  targetWeight?: number; // kg
  fitnessGoal?: 'Weight Loss' | 'Gain Muscle' | 'Endurance' | 'Maintenance' | string;
  fitnessLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  dietaryPreference?: string;
  allergies?: string[];
  dailyCalorieTarget?: number;
  dailyWaterTarget?: number; // ml
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'Customer' | 'Coach';
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface OnboardingData {
  gender: 'Male' | 'Female' | 'Other';
  height: number;
  weight: number;
  targetWeight: number;
  fitnessGoal: string;
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  dietaryPreference: string;
  allergies: string[];
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active';
}

// Coach Types
export interface CoachProfile {
  _id: string;
  userId: string | User;
  bio: string;
  specialties: string[];
  experienceYears: number;
  certifications: string[];
  socialLinks?: Record<string, string>;
  hourlyRate?: number;
  monthlyRate?: number;
  averageRating: number;
  reviewCount?: number;
  isVerified: boolean;
  avatarUrl?: string;
  clientCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoachSessionSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface CoachAvailabilityDay {
  date: string;
  slots: CoachSessionSlot[];
}

export interface BookSessionRequest {
  coachId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface BookedSession {
  _id: string;
  coachId: string | CoachProfile;
  clientId: string | User;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
}

// Workouts
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number; // kg
  restSeconds: number;
  targetMuscle: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  instructions?: string[];
  completedSets?: boolean[];
}

export interface FreeWorkout {
  _id: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  duration: number; // minutes
  calories: number;
  category?: 'Strength' | 'Cardio' | 'HIIT' | 'Mobility' | 'Hypertrophy';
  targetMuscles?: string[];
  exercises?: Exercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ActiveWorkoutState {
  workout: FreeWorkout | null;
  currentExerciseIndex: number;
  completedSets: Record<string, number>; // exerciseId -> completed count
  elapsedSeconds: number;
  restTimerSeconds: number;
  isTimerRunning: boolean;
  isResting: boolean;
}

// Nutrition
export interface NutritionMeal {
  _id?: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  imageUrl?: string;
  ingredients?: string[];
  instructions?: string[];
}

export interface FreeNutrition {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals?: NutritionMeal[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodLogItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
}

// Store & E-Commerce
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: 'supplements' | 'equipment' | 'apparel' | 'accessories';
  stock: number;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  sku?: string;
  specifications?: Record<string, string>;
  flavors?: string[];
  sizes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedFlavor?: string;
  selectedSize?: string;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentMethod: string;
  createdAt: string;
}

// AI Service
export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  planPreview?: {
    title: string;
    type: 'workout' | 'nutrition';
    summary: string;
  };
}

export interface AIChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AIChatMessage[];
}

export interface AIWorkoutPlanRequest {
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  goals: string[];
  duration: number; // minutes
  equipment: string[];
  targetMuscles: string[];
}

export interface AIMealPlanRequest {
  diet: string;
  targetCalories: number;
  mealsPerDay: number;
  allergies: string[];
}

export interface AIPlanResponse {
  title: string;
  description: string;
  planType: 'workout' | 'meal' | 'full';
  content: string;
  rawJson?: any;
  recommendations?: string[];
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  schedule?: {
    day: string;
    focus: string;
    exercises: string[];
  }[];
  createdAt?: string;
}

// Chat / Messaging
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  isRead?: boolean;
}

export interface Conversation {
  _id: string;
  participant: {
    _id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

// Progress
export interface WeightLogEntry {
  id: string;
  date: string;
  weight: number; // kg
  bodyFat?: number; // %
}

export interface WorkoutVolumeEntry {
  date: string;
  volume: number; // total kg lifted
  workoutsCount: number;
  caloriesBurned: number;
}

export interface ProgressPhotoEntry {
  id: string;
  date: string;
  imageUrl: string;
  tag: 'Front' | 'Side' | 'Back';
  weight: number;
  notes?: string;
}

// Notification
export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'workout' | 'chat' | 'order' | 'reminder' | 'system';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}
