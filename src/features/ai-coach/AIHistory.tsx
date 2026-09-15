import { Link } from 'react-router-dom';
import { Bot, Dumbbell, Utensils, Clock, ArrowRight, Play, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MOCK_WORKOUTS, MOCK_NUTRITION } from '../../lib/mockData';

export function AIHistory() {
  const savedRoutines = MOCK_WORKOUTS;
  const savedMeals = MOCK_NUTRITION;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          AI Generation History
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Review and re-launch your tailored AI fitness protocols and nutrition recommendations.
        </p>
      </div>

      {/* Routines section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-accent" /> Saved AI Workout Routines
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedRoutines.map((routine) => (
            <Card key={routine._id} hoverEffect className="p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="accent" size="sm">
                    {routine.difficulty}
                  </Badge>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {routine.duration} mins
                  </span>
                </div>

                <h3 className="text-base font-bold text-text-primary">{routine.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2">{routine.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-accent">
                  {routine.exercises?.length || 4} Movements
                </span>
                <Link to="/workouts/play">
                  <Button variant="primary" size="sm">
                    <Play className="w-3.5 h-3.5 fill-black mr-1" /> Launch
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Meal plans section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Utensils className="w-4 h-4 text-accent" /> Saved AI Nutritional Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedMeals.map((meal) => (
            <Card key={meal._id} hoverEffect className="p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="neutral" size="sm">
                    {meal.calories} kcal
                  </Badge>
                  <span className="text-xs text-accent font-semibold">{meal.protein}g Protein</span>
                </div>

                <h3 className="text-base font-bold text-text-primary">{meal.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2">{meal.content}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                <div className="text-xs text-text-muted">
                  <span>C: {meal.carbs}g</span> • <span>F: {meal.fats}g</span>
                </div>
                <Link to="/nutrition">
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
