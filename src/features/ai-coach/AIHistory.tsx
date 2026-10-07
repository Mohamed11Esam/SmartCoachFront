import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Utensils, Clock, ArrowRight, Play, Sparkles } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Workout, FreeNutrition } from '../../types';
import api from '../../lib/axios';

export function AIHistory() {
  const [savedRoutines, setSavedRoutines] = useState<Workout[]>([]);
  const [savedMeals, setSavedMeals] = useState<FreeNutrition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [workoutsRes, mealsRes] = await Promise.all([
          api.get('/workouts').catch(() => ({ data: [] })),
          api.get('/nutrition').catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(workoutsRes.data)) {
          setSavedRoutines(workoutsRes.data);
        }
        if (Array.isArray(mealsRes.data)) {
          setSavedMeals(mealsRes.data);
        }
      } catch (err) {
        console.error('Failed to load AI history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-5 flex flex-col justify-between border-border/80 animate-pulse space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-card-hover rounded w-20" />
                    <div className="h-4 bg-card-hover rounded w-16" />
                  </div>
                  <div className="h-5 bg-card-hover rounded w-3/4" />
                  <div className="h-3 bg-card-hover rounded w-full" />
                  <div className="h-3 bg-card-hover rounded w-2/3" />
                </div>
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="h-4 bg-card-hover rounded w-24" />
                  <div className="h-8 bg-card-hover rounded w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : savedRoutines.length === 0 ? (
          <Card className="p-8 text-center border-border flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-main border border-border flex items-center justify-center text-accent">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">No Saved Workouts</h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
                No saved workouts yet. Generate a customized training protocol with Coach Apex!
              </p>
            </div>
            <Link to="/ai-coach">
              <Button variant="primary" size="sm" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Generate Protocol <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </Card>
        ) : (
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
        )}
      </div>

      {/* Meal plans section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Utensils className="w-4 h-4 text-accent" /> Saved AI Nutritional Plans
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-5 flex flex-col justify-between border-border/80 animate-pulse space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-card-hover rounded w-20" />
                    <div className="h-4 bg-card-hover rounded w-24" />
                  </div>
                  <div className="h-5 bg-card-hover rounded w-3/4" />
                  <div className="h-3 bg-card-hover rounded w-full" />
                  <div className="h-3 bg-card-hover rounded w-2/3" />
                </div>
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="h-4 bg-card-hover rounded w-28" />
                  <div className="h-8 bg-card-hover rounded w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : savedMeals.length === 0 ? (
          <Card className="p-8 text-center border-border flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-main border border-border flex items-center justify-center text-accent">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">No Saved Nutrition Protocols</h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
                No saved nutrition protocols yet.
              </p>
            </div>
            <Link to="/ai-coach">
              <Button variant="primary" size="sm" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Generate Protocol <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
          </Card>
        ) : (
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
        )}
      </div>
    </div>
  );
}
