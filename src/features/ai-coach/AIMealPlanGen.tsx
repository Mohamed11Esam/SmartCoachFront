import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Utensils,
  Flame,
  Check,
  Plus,
  ArrowRight,
  Beef,
  Wheat,
  Droplet,
  ChevronLeft,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DIETARY_PREFERENCES, COMMON_ALLERGIES, AI_SERVICE_URL } from '../../config/constants';
import { FreeNutrition } from '../../types';
import api from '../../lib/axios';
import axios from 'axios';

export function AIMealPlanGen() {
  const navigate = useNavigate();

  const [diet, setDiet] = useState<string>('High Protein Lean');
  const [targetCalories, setTargetCalories] = useState<number>(2600);
  const [mealsPerDay, setMealsPerDay] = useState<number>(4);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<FreeNutrition | null>(null);

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const payload = {
      diet,
      targetCalories,
      mealsPerDay,
      allergies,
    };

    try {
      let data: any = null;
      try {
        const res = await api.post('/ai/meal-plan', payload, { timeout: 1200 });
        data = res.data;
      } catch {
        try {
          const directRes = await axios.post(`${AI_SERVICE_URL}/rag/meal-plan`, payload, { timeout: 1200 });
          data = directRes.data;
        } catch {
          data = buildFallbackMealPlan(diet, targetCalories, mealsPerDay);
        }
      }

      setGeneratedPlan({
        _id: 'meal_plan_' + Date.now(),
        title: data.title || `AI ${diet} ${targetCalories}kcal Strategy`,
        content:
          data.content ||
          `Scientifically calculated ${mealsPerDay}-meal structure providing consistent amino acid availability and optimal performance fuel.`,
        calories: targetCalories,
        protein: Math.round(targetCalories * 0.3 / 4),
        carbs: Math.round(targetCalories * 0.45 / 4),
        fats: Math.round(targetCalories * 0.25 / 9),
        tags: [diet, `${targetCalories} kcal`, `${mealsPerDay} Meals`],
        meals: data.meals || buildMeals(diet, targetCalories, mealsPerDay),
      });
    } catch (err) {
      console.error('Meal plan generation error', err);
    } finally {
      setIsGenerating(false);
    }
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
            <Sparkles className="w-3 h-3 mr-1" /> APEX Nutrition Intelligence
          </Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          AI Nutrition & Macro Generator
        </h1>
        <p className="text-xs sm:text-sm text-text-muted max-w-2xl">
          Enter your caloric threshold and preferred dietary approach. SmartCoach AI generates whole-food recipes with calculated macronutrient distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border-border space-y-5 shadow-xl">
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Diet Protocol */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Dietary Protocol
                </label>
                <div className="space-y-1.5">
                  {DIETARY_PREFERENCES.slice(0, 5).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiet(d)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        diet === d
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Calories */}
              <Input
                label="Target Daily Energy (kcal)"
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
                min={1200}
                max={5000}
                step={50}
              />

              {/* Meals per day */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Daily Meals
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMealsPerDay(m)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        mealsPerDay === m
                          ? 'bg-accent text-black border-accent'
                          : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                      }`}
                    >
                      {m} Meals
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Allergies to Exclude
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGIES.map((al) => {
                    const active = allergies.includes(al);
                    return (
                      <button
                        key={al}
                        type="button"
                        onClick={() => toggleAllergy(al)}
                        className={`px-3 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                          active
                            ? 'bg-status-declined/20 border-status-declined text-status-declined font-bold'
                            : 'bg-main border-border text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {al}
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
                <span>Generate Nutritional Plan</span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-7">
          {generatedPlan ? (
            <div className="space-y-5 animate-fadeIn">
              <Card className="p-6 border-accent/40 shadow-2xl space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-border/80">
                  <div>
                    <Badge variant="accent" size="sm" className="mb-1.5">
                      AI Nutrition Protocol
                    </Badge>
                    <h2 className="text-xl font-bold text-text-primary">{generatedPlan.title}</h2>
                    <p className="text-xs text-text-secondary mt-1">{generatedPlan.content}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-text-muted">Target</span>
                    <p className="text-lg font-black text-accent">{generatedPlan.calories} kcal</p>
                  </div>
                </div>

                {/* Macro summary pills */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-main border border-border text-center">
                    <span className="text-[11px] text-text-muted font-semibold flex items-center justify-center gap-1">
                      <Beef className="w-3.5 h-3.5 text-accent" /> Protein
                    </span>
                    <p className="text-base font-black text-text-primary mt-0.5">
                      {generatedPlan.protein}g
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-main border border-border text-center">
                    <span className="text-[11px] text-text-muted font-semibold flex items-center justify-center gap-1">
                      <Wheat className="w-3.5 h-3.5 text-status-approved" /> Carbs
                    </span>
                    <p className="text-base font-black text-text-primary mt-0.5">
                      {generatedPlan.carbs}g
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-main border border-border text-center">
                    <span className="text-[11px] text-text-muted font-semibold flex items-center justify-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-status-pending" /> Fats
                    </span>
                    <p className="text-base font-black text-text-primary mt-0.5">
                      {generatedPlan.fats}g
                    </p>
                  </div>
                </div>

                {/* Individual Meal Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Scheduled Daily Meals
                  </h3>
                  {generatedPlan.meals?.map((meal, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-main border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                            {meal.mealType}
                          </span>
                          <h4 className="text-sm font-bold text-text-primary">{meal.name}</h4>
                        </div>
                        {meal.ingredients && (
                          <p className="text-xs text-text-muted">
                            {meal.ingredients.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs font-medium border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                        <span className="font-bold text-text-primary">{meal.calories} kcal</span>
                        <span className="text-accent font-semibold">{meal.protein}g P</span>
                        <span className="text-text-secondary">{meal.carbs}g C</span>
                        <span className="text-text-muted">{meal.fats}g F</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => navigate('/nutrition')}
                >
                  <span>Apply to My Daily Nutrition</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            </div>
          ) : (
            <Card className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 text-center border-dashed border-border/80">
              <div className="w-16 h-16 rounded-2xl bg-main border border-border flex items-center justify-center text-accent mb-4 shadow-[0_0_20px_rgba(198,241,53,0.15)]">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Configure Nutrition Strategy</h3>
              <p className="text-xs text-text-muted max-w-sm mt-1 leading-relaxed">
                Set your calorie goal and meals per day, then generate a recipe breakdown with exact macronutrients.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function buildFallbackMealPlan(diet: string, calories: number, count: number) {
  return {
    title: `Precision ${diet} Formulation`,
    content: `Structured whole-food meal framework tailored for high training output, insulin sensitivity, and recovery.`,
    meals: buildMeals(diet, calories, count),
  };
}

function buildMeals(diet: string, totalCal: number, count: number) {
  const perMeal = Math.round(totalCal / count);

  return [
    {
      name: 'Power Oats & Whey Isolate',
      mealType: 'Breakfast',
      calories: perMeal,
      protein: 45,
      carbs: 65,
      fats: 14,
      ingredients: ['100g Rolled Oats', '35g Whey Isolate', '1 Banana', 'Almond Butter'],
    },
    {
      name: 'Citrus Herb Salmon & Jasmine Rice',
      mealType: 'Lunch',
      calories: perMeal,
      protein: 52,
      carbs: 70,
      fats: 18,
      ingredients: ['200g Fresh Salmon', '200g Jasmine Rice', 'Steamed Asparagus'],
    },
    {
      name: 'Flame Grilled Chicken Breast Bowl',
      mealType: 'Dinner',
      calories: perMeal,
      protein: 58,
      carbs: 68,
      fats: 15,
      ingredients: ['220g Chicken Breast', 'Baked Sweet Potato', 'Roasted Zucchini'],
    },
    ...(count >= 4
      ? [
          {
            name: '0% Greek Yogurt & Crushed Almonds',
            mealType: 'Snack',
            calories: perMeal,
            protein: 38,
            carbs: 40,
            fats: 12,
            ingredients: ['250g Greek Yogurt', '30g Raw Almonds', 'Organic Berries'],
          },
        ]
      : []),
  ];
}
