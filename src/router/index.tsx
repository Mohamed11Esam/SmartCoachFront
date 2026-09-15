import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ClientLayout } from '../components/layout/ClientLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Feature Pages
import { Login } from '../features/auth/Login';
import { Register } from '../features/auth/Register';
import { OnboardingWizard } from '../features/auth/OnboardingWizard';
import { Dashboard } from '../features/dashboard/Dashboard';
import { AIChat } from '../features/ai-coach/AIChat';
import { AIWorkoutPlanGen } from '../features/ai-coach/AIWorkoutPlanGen';
import { AIMealPlanGen } from '../features/ai-coach/AIMealPlanGen';
import { AIHistory } from '../features/ai-coach/AIHistory';
import { WorkoutList } from '../features/workouts/WorkoutList';
import { ActiveWorkoutPlayer } from '../features/workouts/ActiveWorkoutPlayer';
import { NutritionTracker } from '../features/nutrition/NutritionTracker';
import { CoachMarketplace } from '../features/coaches/CoachMarketplace';
import { CoachChat } from '../features/chat/CoachChat';
import { StoreCatalog } from '../features/store/StoreCatalog';
import { Checkout } from '../features/store/Checkout';
import { ProgressAnalytics } from '../features/progress/ProgressAnalytics';
import { UserProfile } from '../features/profile/UserProfile';

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ),
  },

  // Protected Athlete Application Layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <ClientLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },

      // AI Hub
      {
        path: 'ai',
        children: [
          {
            index: true,
            element: <Navigate to="/ai/chat" replace />,
          },
          {
            path: 'chat',
            element: <AIChat />,
          },
          {
            path: 'workout-plan',
            element: <AIWorkoutPlanGen />,
          },
          {
            path: 'meal-plan',
            element: <AIMealPlanGen />,
          },
          {
            path: 'history',
            element: <AIHistory />,
          },
        ],
      },

      // Workouts
      {
        path: 'workouts',
        children: [
          {
            index: true,
            element: <WorkoutList />,
          },
          {
            path: 'play',
            element: <ActiveWorkoutPlayer />,
          },
        ],
      },

      // Nutrition
      {
        path: 'nutrition',
        element: <NutritionTracker />,
      },

      // Coaches & Live Chat
      {
        path: 'coaches',
        element: <CoachMarketplace />,
      },
      {
        path: 'chat',
        element: <CoachChat />,
      },

      // E-Commerce Store
      {
        path: 'store',
        element: <StoreCatalog />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },

      // Progress & Analytics
      {
        path: 'progress',
        element: <ProgressAnalytics />,
      },

      // Profile & Settings
      {
        path: 'profile',
        element: <UserProfile />,
      },

      // Fallback
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
