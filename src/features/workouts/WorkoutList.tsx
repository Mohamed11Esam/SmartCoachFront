import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Dumbbell,
  Play,
  Clock,
  Flame,
  Bookmark,
  BookmarkCheck,
  Filter,
  Sparkles,
  Search,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { useWorkoutStore } from '../../stores/workoutStore';
import { FreeWorkout } from '../../types';
import api from '../../lib/axios';

const CATEGORIES = [
  { id: 'all', label: 'All Routines' },
  { id: 'Hypertrophy', label: 'Hypertrophy' },
  { id: 'Strength', label: 'Strength' },
  { id: 'HIIT', label: 'Cardio & HIIT' },
];

export function WorkoutList() {
  const navigate = useNavigate();
  const { startWorkout, toggleSaveWorkout, isWorkoutSaved } = useWorkoutStore();

  const [workouts, setWorkouts] = useState<FreeWorkout[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/workouts');
      if (Array.isArray(data)) {
        setWorkouts(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load workouts from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const filteredWorkouts = workouts.filter((w) => {
    const matchesCategory =
      activeCategory === 'all' || w.category === activeCategory || w.tags?.includes(activeCategory);
    const matchesDifficulty =
      selectedDifficulty === 'all' || w.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleStartWorkout = (workout: FreeWorkout) => {
    startWorkout(workout);
    navigate('/workouts/play');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              Exercise Science Database
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Curated Workout Routines
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Evidence-based training routines featuring set-by-set logging, guided rest timers, and movement cues.
          </p>
        </div>

        <Link to="/ai/workout-plan">
          <Button variant="accent-glow" size="md" className="gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Generate Custom AI Routine</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <Tabs
          tabs={CATEGORIES}
          activeTab={activeCategory}
          onChange={setActiveCategory}
          className="w-full lg:w-auto"
        />

        {/* Search & Difficulty Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search muscle, title..."
              className="w-full bg-input-bg border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Workout Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden flex flex-col justify-between border-border/80 animate-pulse">
              <div className="aspect-video w-full bg-main/80" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-card rounded w-3/4" />
                <div className="h-3 bg-card rounded w-full" />
                <div className="h-3 bg-card rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <Card className="p-12 text-center border-border space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-text-muted">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">No workouts found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              {error || 'No routines matched your active filter or search query. Try broadening your criteria.'}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setActiveCategory('all'); setSelectedDifficulty('all'); setSearchQuery(''); fetchWorkouts(); }}>
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkouts.map((workout) => {
          const isSaved = isWorkoutSaved(workout._id);

          return (
            <Card
              key={workout._id}
              hoverEffect
              className="overflow-hidden flex flex-col justify-between group border-border/80"
            >
              <div>
                {/* Thumbnail with overlay badges */}
                <div className="relative aspect-video w-full overflow-hidden bg-main border-b border-border/60">
                  <img
                    src={
                      workout.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600'
                    }
                    alt={workout.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant="accent" size="sm">
                      {workout.difficulty}
                    </Badge>
                  </div>

                  {/* Bookmark favorite button */}
                  <button
                    onClick={() => toggleSaveWorkout(workout._id)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:text-accent transition-colors cursor-pointer"
                    title={isSaved ? 'Remove from saved' : 'Save workout'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-accent fill-accent" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  {/* Duration & Calories Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-medium">
                    <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      {workout.duration} mins
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <Flame className="w-3.5 h-3.5 text-status-pending" />
                      {workout.calories} kcal
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                    {workout.title}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {workout.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {workout.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-main text-text-muted border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer: Exercise count & Start button */}
              <div className="p-5 pt-0 mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-accent" />
                  {workout.exercises?.length || 4} Exercises
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartWorkout(workout)}
                  className="gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Start Workout</span>
                </Button>
              </div>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
