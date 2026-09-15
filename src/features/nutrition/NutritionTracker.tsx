import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Plus,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Sparkles,
  Trash2,
  Check,
  ChevronRight,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { FoodLogItem, FreeNutrition } from '../../types';
import { MOCK_NUTRITION } from '../../lib/mockData';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/axios';

const INITIAL_FOOD_LOG: FoodLogItem[] = [
  {
    id: 'f1',
    name: 'Power Oats with Isolate Whey & Berries',
    calories: 680,
    protein: 48,
    carbs: 82,
    fats: 16,
    mealType: 'breakfast',
    time: '08:30 AM',
  },
  {
    id: 'f2',
    name: 'Wild Atlantic Salmon with Jasmine Rice & Asparagus',
    calories: 820,
    protein: 56,
    carbs: 88,
    fats: 24,
    mealType: 'lunch',
    time: '01:15 PM',
  },
  {
    id: 'f3',
    name: '0% Greek Yogurt with Honey & Walnuts',
    calories: 440,
    protein: 38,
    carbs: 42,
    fats: 12,
    mealType: 'snack',
    time: '04:30 PM',
  },
];

export function NutritionTracker() {
  const { user } = useAuthStore();
  const [foodLogs, setFoodLogs] = useState<FoodLogItem[]>(INITIAL_FOOD_LOG);
  const [nutritionPlans, setNutritionPlans] = useState<FreeNutrition[]>(MOCK_NUTRITION);

  // Add Food Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number>(650);
  const [protein, setProtein] = useState<number>(45);
  const [carbs, setCarbs] = useState<number>(60);
  const [fats, setFats] = useState<number>(15);

  // Recipe viewer modal
  const [viewRecipe, setViewRecipe] = useState<any | null>(null);

  // Daily targets from user profile
  const calorieTarget = user?.dailyCalorieTarget || 2750;
  const proteinTarget = 190;
  const carbsTarget = 260;
  const fatsTarget = 70;

  // Computed totals
  const totalCalories = foodLogs.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = foodLogs.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = foodLogs.reduce((sum, item) => sum + item.carbs, 0);
  const totalFats = foodLogs.reduce((sum, item) => sum + item.fats, 0);

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const newItem: FoodLogItem = {
      id: 'f_' + Date.now(),
      name: foodName,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fats: Number(fats),
      mealType: selectedMealType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setFoodLogs([newItem, ...foodLogs]);
    setIsAddModalOpen(false);
    setFoodName('');
  };

  const handleDeleteFood = (id: string) => {
    setFoodLogs(foodLogs.filter((f) => f.id !== id));
  };

  const mealSlots = [
    { type: 'breakfast' as const, label: 'Breakfast', icon: '🌅' },
    { type: 'lunch' as const, label: 'Lunch', icon: '☀️' },
    { type: 'dinner' as const, label: 'Dinner', icon: '🌙' },
    { type: 'snack' as const, label: 'Snacks & Pre-Workout', icon: '⚡' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              Macronutrient Intelligence
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Daily Nutrition & Food Logger
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Track your caloric intake, balance essential amino acids, and hit precision athletic macros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/ai/meal-plan">
            <Button variant="secondary" size="md" className="gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Generate AI Meal Plan</span>
            </Button>
          </Link>
          <Button
            variant="accent-glow"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal</span>
          </Button>
        </div>
      </div>

      {/* Top Macro Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Calorie Card */}
        <Card className="p-5 border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Energy Consumed</span>
            <Flame className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-text-primary">{totalCalories}</span>
              <span className="text-xs text-text-muted">/ {calorieTarget} kcal</span>
            </div>
            <p className="text-[11px] text-accent font-semibold mt-0.5">
              {Math.max(0, calorieTarget - totalCalories)} kcal remaining
            </p>
          </div>
          <ProgressBar
            value={totalCalories}
            max={calorieTarget}
            variant="accent"
            height="sm"
          />
        </Card>

        {/* Protein Card */}
        <Card className="p-5 border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Protein</span>
            <Beef className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-text-primary">{totalProtein}g</span>
              <span className="text-xs text-text-muted">/ {proteinTarget}g</span>
            </div>
            <p className="text-[11px] text-status-approved font-semibold mt-0.5">
              {Math.round((totalProtein / proteinTarget) * 100)}% of muscle target
            </p>
          </div>
          <ProgressBar
            value={totalProtein}
            max={proteinTarget}
            variant="approved"
            height="sm"
          />
        </Card>

        {/* Carbs Card */}
        <Card className="p-5 border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Carbohydrates</span>
            <Wheat className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-text-primary">{totalCarbs}g</span>
              <span className="text-xs text-text-muted">/ {carbsTarget}g</span>
            </div>
            <p className="text-[11px] text-text-muted font-semibold mt-0.5">
              {Math.round((totalCarbs / carbsTarget) * 100)}% of glycogen fuel
            </p>
          </div>
          <ProgressBar
            value={totalCarbs}
            max={carbsTarget}
            variant="accent"
            height="sm"
          />
        </Card>

        {/* Fats Card */}
        <Card className="p-5 border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase">Fats</span>
            <Droplet className="w-4 h-4 text-status-pending" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-text-primary">{totalFats}g</span>
              <span className="text-xs text-text-muted">/ {fatsTarget}g</span>
            </div>
            <p className="text-[11px] text-text-muted font-semibold mt-0.5">
              {Math.round((totalFats / fatsTarget) * 100)}% of lipid baseline
            </p>
          </div>
          <ProgressBar
            value={totalFats}
            max={fatsTarget}
            variant="warning"
            height="sm"
          />
        </Card>
      </div>

      {/* Main Meal Logger Slots */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-text-primary">Today's Meal Timeline</h2>

        <div className="space-y-4">
          {mealSlots.map((slot) => {
            const slotItems = foodLogs.filter((item) => item.mealType === slot.type);
            const slotCalories = slotItems.reduce((sum, i) => sum + i.calories, 0);

            return (
              <Card key={slot.type} className="p-5 border-border/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{slot.icon}</span>
                    <h3 className="text-sm font-bold text-text-primary">{slot.label}</h3>
                    <span className="text-xs text-text-muted">
                      ({slotCalories} kcal)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMealType(slot.type);
                      setIsAddModalOpen(true);
                    }}
                    className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Food
                  </button>
                </div>

                {slotItems.length === 0 ? (
                  <p className="text-xs text-text-muted py-2">
                    No foods logged for {slot.label} yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {slotItems.map((food) => (
                      <div
                        key={food.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-main border border-border/70 text-xs"
                      >
                        <div>
                          <p className="font-bold text-text-primary">{food.name}</p>
                          <p className="text-[10px] text-text-muted">{food.time}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold text-text-primary">{food.calories} kcal</span>
                          <span className="text-accent font-semibold">{food.protein}g P</span>
                          <span className="text-text-secondary">{food.carbs}g C</span>
                          <span className="text-text-muted">{food.fats}g F</span>

                          <button
                            onClick={() => handleDeleteFood(food.id)}
                            className="p-1 text-text-muted hover:text-status-declined transition-colors cursor-pointer"
                            title="Remove food"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Curated Athlete Recipes & Protocols */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          <span>Curated Athlete Nutrition Protocols</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nutritionPlans.map((plan) => (
            <Card key={plan._id} hoverEffect className="overflow-hidden group border-border">
              <div className="relative aspect-video w-full bg-main overflow-hidden">
                <img
                  src={plan.imageUrl}
                  alt={plan.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge variant="accent" size="sm">
                    {plan.calories} kcal
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="text-base font-bold text-text-primary">{plan.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2">{plan.content}</p>

                <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-border/60">
                  <span className="text-accent">{plan.protein}g Protein</span>
                  <span className="text-text-secondary">{plan.carbs}g Carbs</span>
                  <span className="text-text-muted">{plan.fats}g Fats</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setViewRecipe(plan)}
                >
                  Inspect Protocol Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Log Food Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Food or Recipe"
        maxWidth="md"
      >
        <form onSubmit={handleAddFood} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Meal Slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedMealType(slot)}
                  className={`py-2 text-xs font-bold rounded-xl border capitalize cursor-pointer transition-all ${
                    selectedMealType === slot
                      ? 'bg-accent text-black border-accent'
                      : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Food / Recipe Name"
            placeholder="e.g. Grass-Fed Beef Sirloin with Sweet Potato"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Energy (kcal)"
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              required
            />
            <Input
              label="Protein (g)"
              type="number"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Carbohydrates (g)"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              required
            />
            <Input
              label="Healthy Fats (g)"
              type="number"
              value={fats}
              onChange={(e) => setFats(Number(e.target.value))}
              required
            />
          </div>

          <Button type="submit" variant="accent-glow" size="lg" className="w-full mt-2">
            <Plus className="w-4 h-4 mr-1.5" /> Save Food Entry
          </Button>
        </form>
      </Modal>

      {/* Recipe Detail Modal */}
      {viewRecipe && (
        <Modal
          isOpen={true}
          onClose={() => setViewRecipe(null)}
          title={viewRecipe.title}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-text-secondary leading-relaxed">{viewRecipe.content}</p>

            <div className="p-4 rounded-xl bg-main border border-border flex items-center justify-around text-center">
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Total Calories</p>
                <p className="text-lg font-black text-accent">{viewRecipe.calories} kcal</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Protein</p>
                <p className="text-lg font-black text-text-primary">{viewRecipe.protein}g</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Carbs</p>
                <p className="text-lg font-black text-text-primary">{viewRecipe.carbs}g</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Fats</p>
                <p className="text-lg font-black text-text-primary">{viewRecipe.fats}g</p>
              </div>
            </div>

            {viewRecipe.meals && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-text-muted uppercase">Structured Dishes</h4>
                {viewRecipe.meals.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-main border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-text-primary">{m.name}</p>
                      <p className="text-[11px] text-text-muted">{m.mealType}</p>
                    </div>
                    <span className="font-bold text-accent">{m.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
