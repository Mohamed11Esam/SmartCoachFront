import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Scan,
  Camera,
  Search,
  Sparkles,
  Utensils,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Check,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Barcode,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { FoodLogItem } from '../../types';
import toast from 'react-hot-toast';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (item: FoodLogItem) => void;
  initialMealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  servingSizeText: string;
  servingGrams?: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatsPerServing: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatsPer100g?: number;
}

const PRESET_TEST_PRODUCTS: Array<{
  barcode: string;
  label: string;
  brand: string;
  macros: string;
  product: ScannedProduct;
}> = [
  {
    barcode: '0811620021678',
    label: 'Fairlife Core Power Elite 42g',
    brand: 'Fairlife',
    macros: '230 kcal • 42g P • 8g C',
    product: {
      barcode: '0811620021678',
      name: 'Core Power Elite 42g High Protein Shake (Chocolate)',
      brand: 'Fairlife',
      imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&q=80&w=400',
      servingSizeText: '1 bottle (414 mL / 14 fl oz)',
      servingGrams: 414,
      caloriesPerServing: 230,
      proteinPerServing: 42,
      carbsPerServing: 8,
      fatsPerServing: 3.5,
      caloriesPer100g: 56,
      proteinPer100g: 10.1,
      carbsPer100g: 1.9,
      fatsPer100g: 0.8,
    },
  },
  {
    barcode: '0748927028669',
    label: 'Optimum Nutrition Gold Standard Whey',
    brand: 'Optimum Nutrition',
    macros: '120 kcal • 24g P • 3g C',
    product: {
      barcode: '0748927028669',
      name: '100% Whey Gold Standard (Double Rich Chocolate)',
      brand: 'Optimum Nutrition',
      imageUrl: 'https://images.openfoodfacts.org/images/products/074/892/702/8669/front_en.145.400.jpg',
      servingSizeText: '1 scoop (30.4g)',
      servingGrams: 30.4,
      caloriesPerServing: 120,
      proteinPerServing: 24,
      carbsPerServing: 3,
      fatsPerServing: 1.5,
      caloriesPer100g: 395,
      proteinPer100g: 79,
      carbsPer100g: 9.9,
      fatsPer100g: 4.9,
    },
  },
  {
    barcode: '0888849000010',
    label: 'Quest Cookie Dough Protein Bar',
    brand: 'Quest Nutrition',
    macros: '200 kcal • 21g P • 22g C',
    product: {
      barcode: '0888849000010',
      name: 'Chocolate Chip Cookie Dough Protein Bar',
      brand: 'Quest Nutrition',
      imageUrl: 'https://images.unsplash.com/photo-1622484216834-31da55a9ce97?auto=format&fit=crop&q=80&w=400',
      servingSizeText: '1 bar (60g)',
      servingGrams: 60,
      caloriesPerServing: 200,
      proteinPerServing: 21,
      carbsPerServing: 22,
      fatsPerServing: 9,
      caloriesPer100g: 333,
      proteinPer100g: 35,
      carbsPer100g: 36.7,
      fatsPer100g: 15,
    },
  },
  {
    barcode: '0898248001004',
    label: "Siggi's Icelandic Skyr 0%",
    brand: "Siggi's",
    macros: '110 kcal • 16g P • 11g C',
    product: {
      barcode: '0898248001004',
      name: 'Icelandic Strained Skyr 0% Milkfat (Vanilla)',
      brand: "Siggi's",
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400',
      servingSizeText: '1 container (150g / 5.3 oz)',
      servingGrams: 150,
      caloriesPerServing: 110,
      proteinPerServing: 16,
      carbsPerServing: 11,
      fatsPerServing: 0,
      caloriesPer100g: 73,
      proteinPer100g: 10.7,
      carbsPer100g: 7.3,
      fatsPer100g: 0,
    },
  },
];

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onAddFood,
  initialMealType = 'snack',
}: BarcodeScannerModalProps) {
  const [viewMode, setViewMode] = useState<'scan' | 'result'>('scan');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Result state
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialMealType);
  const [portionMode, setPortionMode] = useState<'1' | '2' | '0.5' | 'custom'>('1');
  const [customGrams, setCustomGrams] = useState<number>(100);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'apex-barcode-reader';

  // Keep meal type in sync with initial prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMealType(initialMealType);
      setViewMode('scan');
      setScannerError(null);
    }
  }, [isOpen, initialMealType]);

  // Start Camera Stream
  useEffect(() => {
    let isCancelled = false;

    if (!isOpen || viewMode !== 'scan') {
      stopCamera();
      return;
    }

    const timer = setTimeout(() => {
      const container = document.getElementById(readerElementId);
      if (!container || isCancelled) return;

      try {
        const qr = new Html5Qrcode(readerElementId);
        scannerRef.current = qr;

        qr.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isCancelled) {
              handleBarcodeScanned(decodedText);
            }
          },
          () => {
            // standard frame scan noise, ignore
          }
        )
          .then(() => {
            if (!isCancelled) {
              setIsCameraActive(true);
              setScannerError(null);
            }
          })
          .catch((err) => {
            if (!isCancelled) {
              console.warn('Camera stream error:', err);
              setIsCameraActive(false);
              setScannerError(
                'Camera stream unavailable or permission denied. You can test with preset fitness barcodes or enter any barcode number manually.'
              );
            }
          });
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('HTML5 Scanner initialization warning:', err);
          setScannerError('Could not initialize video scanner. Use test barcodes or manual entry.');
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, viewMode]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error closing scanner stream:', err);
      } finally {
        scannerRef.current = null;
        setIsCameraActive(false);
      }
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    if (navigator.vibrate) {
      navigator.vibrate([40, 20, 40]);
    }
    await stopCamera();
    lookupBarcode(barcode);
  };

  const lookupBarcode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      toast.error('Please enter a valid barcode number');
      return;
    }

    setIsLoading(true);
    let foundProduct: ScannedProduct | null = null;

    try {
      // 1. Query OpenFoodFacts API
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, {
        headers: {
          'User-Agent': 'ApexAthleticApp - Web - Version 1.0 (athlete-support@apexathletic.com)',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 1 && data.product) {
          const p = data.product;
          const nutriments = p.nutriments || {};

          const kcal100 = nutriments['energy-kcal_100g'] ?? (nutriments['energy-kj_100g'] ? Math.round(nutriments['energy-kj_100g'] / 4.184) : undefined);
          const kcalServ = nutriments['energy-kcal_serving'] ?? (nutriments['energy-kj_serving'] ? Math.round(nutriments['energy-kj_serving'] / 4.184) : undefined);

          const prot100 = nutriments.proteins_100g;
          const protServ = nutriments.proteins_serving;

          const carbs100 = nutriments.carbohydrates_100g;
          const carbsServ = nutriments.carbohydrates_serving;

          const fats100 = nutriments.fat_100g;
          const fatsServ = nutriments.fat_serving;

          let servingGrams: number | undefined;
          if (p.serving_quantity) {
            servingGrams = Number(p.serving_quantity);
          } else if (p.serving_size) {
            const match = String(p.serving_size).match(/(\d+(\.\d+)?)\s*g/i);
            if (match) servingGrams = parseFloat(match[1]);
          }

          foundProduct = {
            barcode: code,
            name: p.product_name || p.product_name_en || 'Scanned Product',
            brand: p.brands || p.brand_owner || 'OpenFoodFacts Registry',
            imageUrl: p.image_url || p.image_front_url || p.image_front_small_url || '',
            servingSizeText: p.serving_size || (servingGrams ? `${servingGrams}g` : '1 serving (100g)'),
            servingGrams: servingGrams || 100,
            caloriesPerServing: Math.round(kcalServ ?? (kcal100 ?? 150)),
            proteinPerServing: Math.round(protServ ?? (prot100 ?? 10)),
            carbsPerServing: Math.round(carbsServ ?? (carbs100 ?? 15)),
            fatsPerServing: Math.round(fatsServ ?? (fats100 ?? 5)),
            caloriesPer100g: kcal100 !== undefined ? Math.round(kcal100) : undefined,
            proteinPer100g: prot100 !== undefined ? Math.round(prot100) : undefined,
            carbsPer100g: carbs100 !== undefined ? Math.round(carbs100) : undefined,
            fatsPer100g: fats100 !== undefined ? Math.round(fats100) : undefined,
          };
        }
      }
    } catch (apiErr) {
      console.warn('OpenFoodFacts fetch error, falling back to preset catalogue:', apiErr);
    }

    // 2. Preset Fallback Catalogue
    if (!foundProduct) {
      const normalized = code.replace(/^0+/, '');
      const matchedPreset = PRESET_TEST_PRODUCTS.find(
        (item) => item.barcode === code || item.barcode.replace(/^0+/, '') === normalized
      );

      if (matchedPreset) {
        foundProduct = { ...matchedPreset.product };
      }
    }

    if (foundProduct) {
      setScannedProduct(foundProduct);
      setPortionMode('1');
      setCustomGrams(foundProduct.servingGrams || 100);
      setViewMode('result');
      toast.success(`Identified: ${foundProduct.name}`);
    } else {
      toast.error(`Barcode ${code} not found in database. Try a test barcode or manual entry.`);
    }

    setIsLoading(false);
  };

  // Macro Calculation based on portion mode
  const calculateMacros = () => {
    if (!scannedProduct) return { calories: 0, protein: 0, carbs: 0, fats: 0, label: '1 serving' };

    if (portionMode === '1') {
      return {
        calories: scannedProduct.caloriesPerServing,
        protein: scannedProduct.proteinPerServing,
        carbs: scannedProduct.carbsPerServing,
        fats: scannedProduct.fatsPerServing,
        label: `1 serving (${scannedProduct.servingSizeText})`,
      };
    }

    if (portionMode === '2') {
      return {
        calories: scannedProduct.caloriesPerServing * 2,
        protein: scannedProduct.proteinPerServing * 2,
        carbs: scannedProduct.carbsPerServing * 2,
        fats: scannedProduct.fatsPerServing * 2,
        label: `2 servings`,
      };
    }

    if (portionMode === '0.5') {
      return {
        calories: Math.round(scannedProduct.caloriesPerServing * 0.5),
        protein: Math.round(scannedProduct.proteinPerServing * 0.5),
        carbs: Math.round(scannedProduct.carbsPerServing * 0.5),
        fats: Math.round(scannedProduct.fatsPerServing * 0.5),
        label: `0.5 serving`,
      };
    }

    // Custom Grams
    const baseGrams = scannedProduct.servingGrams || 100;
    if (scannedProduct.caloriesPer100g !== undefined) {
      const ratio = customGrams / 100;
      return {
        calories: Math.round((scannedProduct.caloriesPer100g || 0) * ratio),
        protein: Math.round((scannedProduct.proteinPer100g || 0) * ratio),
        carbs: Math.round((scannedProduct.carbsPer100g || 0) * ratio),
        fats: Math.round((scannedProduct.fatsPer100g || 0) * ratio),
        label: `${customGrams}g portion`,
      };
    } else {
      const ratio = customGrams / baseGrams;
      return {
        calories: Math.round(scannedProduct.caloriesPerServing * ratio),
        protein: Math.round(scannedProduct.proteinPerServing * ratio),
        carbs: Math.round(scannedProduct.carbsPerServing * ratio),
        fats: Math.round(scannedProduct.fatsPerServing * ratio),
        label: `${customGrams}g portion`,
      };
    }
  };

  const handleLogFood = () => {
    if (!scannedProduct) return;
    const computed = calculateMacros();

    const newLogItem: FoodLogItem = {
      id: 'off_' + Date.now(),
      name: `${scannedProduct.brand ? scannedProduct.brand + ' ' : ''}${scannedProduct.name} (${computed.label})`,
      calories: computed.calories,
      protein: computed.protein,
      carbs: computed.carbs,
      fats: computed.fats,
      mealType: selectedMealType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onAddFood(newLogItem);
    toast.success(`Logged ${newLogItem.name} (+${newLogItem.calories} kcal)!`);
    onClose();
  };

  const activeMacros = calculateMacros();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={viewMode === 'scan' ? 'Camera Barcode Scanner' : 'Product Nutritional Breakdown'}
      description={
        viewMode === 'scan'
          ? 'SCR-NUTRITION-SCAN • Instant OpenFoodFacts live camera barcode engine with macro parsing.'
          : 'Verify portion sizing and log straight into your daily macronutrient timeline.'
      }
      maxWidth="lg"
    >
      {/* CSS Animation keyframe for HUD laser sweep */}
      <style>{`
        @keyframes laserSweep {
          0% { top: 6%; opacity: 0.8; }
          50% { top: 92%; opacity: 1; }
          100% { top: 6%; opacity: 0.8; }
        }
        .hud-laser {
          animation: laserSweep 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {viewMode === 'scan' ? (
        <div className="space-y-6">
          {/* Viewfinder HUD Container */}
          <div className="relative rounded-2xl overflow-hidden bg-black/95 border border-border shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
            {/* HTML5 QR Camera Element */}
            <div id={readerElementId} className="w-full h-full min-h-[290px] rounded-2xl" />

            {/* Viewfinder Overlays & Corner Reticles */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Scan box with Reticles */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 border border-accent/25 rounded-2xl flex items-center justify-center">
                {/* 4 Corner Reticles */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-sm shadow-[0_0_8px_#c6f135]" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-sm shadow-[0_0_8px_#c6f135]" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-sm shadow-[0_0_8px_#c6f135]" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-sm shadow-[0_0_8px_#c6f135]" />

                {/* Animated Laser Sweep Line */}
                <div className="hud-laser absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_#c6f135]" />

                {/* Center crosshair */}
                <div className="w-3 h-0.5 bg-accent/40" />
                <div className="w-0.5 h-3 bg-accent/40 absolute" />
              </div>

              {/* Status Header Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono tracking-widest text-text-muted">
                <span className="flex items-center gap-1.5 text-accent font-bold">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  HUD // OPENFOODFACTS AI ACTIVE
                </span>
                <span className="bg-black/60 px-2 py-0.5 rounded border border-white/10">3M+ PRODUCTS</span>
              </div>

              {/* Guidance text */}
              <div className="absolute bottom-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur border border-white/10 text-xs text-text-secondary font-medium">
                Align barcode within target reticle
              </div>
            </div>

            {/* Scanner Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                <p className="text-xs font-bold text-text-primary tracking-wide">
                  Querying OpenFoodFacts Database...
                </p>
              </div>
            )}
          </div>

          {/* Scanner Warning / Fallback Notice */}
          {scannerError && (
            <div className="p-3.5 rounded-xl bg-status-pending/10 border border-status-pending/30 flex items-start gap-2.5 text-xs text-status-pending">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{scannerError}</p>
            </div>
          )}

          {/* Manual Barcode Input */}
          <div className="p-4 rounded-2xl bg-main border border-border/70 space-y-3">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Manual Barcode Lookup
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter UPC/EAN code (e.g. 0748927028669)..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    lookupBarcode(manualBarcode);
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="md"
                disabled={isLoading || !manualBarcode.trim()}
                onClick={() => lookupBarcode(manualBarcode)}
                className="gap-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Lookup</span>
              </Button>
            </div>
          </div>

          {/* 4 Preset Test Fitness Products */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Quick-Scan Test Barcodes (Instant 1-Click)</span>
              </span>
              <span className="text-[11px] text-text-muted">Click to preview</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_TEST_PRODUCTS.map((preset) => (
                <button
                  key={preset.barcode}
                  type="button"
                  onClick={() => lookupBarcode(preset.barcode)}
                  disabled={isLoading}
                  className="p-3 rounded-xl bg-main border border-border/80 hover:border-accent hover:bg-card-hover transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                      {preset.label}
                    </h5>
                    <p className="text-[11px] text-text-muted mt-0.5 truncate">{preset.macros}</p>
                    <p className="text-[10px] text-accent/80 font-mono mt-0.5">UPC: {preset.barcode}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Result Preview & Portion Selector */
        scannedProduct && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setViewMode('scan');
                setScannedProduct(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Scan another product</span>
            </button>

            {/* Product Header Card */}
            <div className="p-4 rounded-2xl bg-main border border-border/80 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-20 h-20 rounded-xl bg-card border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {scannedProduct.imageUrl ? (
                  <img
                    src={scannedProduct.imageUrl}
                    alt={scannedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200';
                    }}
                  />
                ) : (
                  <Utensils className="w-8 h-8 text-accent" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="accent" size="sm">
                    {scannedProduct.brand}
                  </Badge>
                  <span className="text-[10px] text-text-muted font-mono">
                    UPC: {scannedProduct.barcode}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary leading-snug">
                  {scannedProduct.name}
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Reference Serving: <span className="text-text-primary">{scannedProduct.servingSizeText}</span>
                </p>
              </div>
            </div>

            {/* Dynamic Macronutrient Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <Card className="p-3.5 border-border bg-card space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-accent text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Calories</span>
                </div>
                <div className="text-2xl font-black text-text-primary">
                  {activeMacros.calories}
                </div>
                <p className="text-[10px] text-text-muted">kcal</p>
              </Card>

              {/* Protein */}
              <Card className="p-3.5 border-border bg-card space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-status-approved text-xs font-semibold">
                  <Beef className="w-3.5 h-3.5" />
                  <span>Protein</span>
                </div>
                <div className="text-2xl font-black text-text-primary">
                  {activeMacros.protein}g
                </div>
                <p className="text-[10px] text-text-muted">Amino baseline</p>
              </Card>

              {/* Carbs */}
              <Card className="p-3.5 border-border bg-card space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 text-xs font-semibold">
                  <Wheat className="w-3.5 h-3.5" />
                  <span>Carbs</span>
                </div>
                <div className="text-2xl font-black text-text-primary">
                  {activeMacros.carbs}g
                </div>
                <p className="text-[10px] text-text-muted">Glycogen fuel</p>
              </Card>

              {/* Fats */}
              <Card className="p-3.5 border-border bg-card space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 text-status-pending text-xs font-semibold">
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Fats</span>
                </div>
                <div className="text-2xl font-black text-text-primary">
                  {activeMacros.fats}g
                </div>
                <p className="text-[10px] text-text-muted">Lipids</p>
              </Card>
            </div>

            {/* Portion Sizing Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Portion Size
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1' as const, label: '1 Serving' },
                  { id: '2' as const, label: '2 Servings' },
                  { id: '0.5' as const, label: '0.5 Serving' },
                  { id: 'custom' as const, label: 'Custom (g)' },
                ].map((portion) => (
                  <button
                    key={portion.id}
                    type="button"
                    onClick={() => setPortionMode(portion.id)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      portionMode === portion.id
                        ? 'bg-accent text-black border-accent'
                        : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                    }`}
                  >
                    {portion.label}
                  </button>
                ))}
              </div>

              {portionMode === 'custom' && (
                <div className="p-3 rounded-xl bg-main border border-border/80 flex items-center gap-3">
                  <span className="text-xs text-text-secondary whitespace-nowrap">Quantity:</span>
                  <Input
                    type="number"
                    min="1"
                    max="2000"
                    value={customGrams}
                    onChange={(e) => setCustomGrams(Math.max(1, Number(e.target.value)))}
                    className="w-32"
                  />
                  <span className="text-xs text-text-muted font-semibold">grams</span>
                </div>
              )}
            </div>

            {/* Meal Slot Picker */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Log Into Daily Timeline Slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => setSelectedMealType(meal)}
                    className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                      selectedMealType === meal
                        ? 'bg-accent text-black border-accent'
                        : 'bg-main border-border text-text-secondary hover:bg-card-hover'
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setViewMode('scan');
                  setScannedProduct(null);
                }}
                className="flex-1"
              >
                Scan Another
              </Button>
              <Button
                type="button"
                variant="accent-glow"
                size="md"
                onClick={handleLogFood}
                className="flex-[2] gap-2 shadow-[0_0_20px_rgba(198,241,53,0.3)]"
              >
                <Check className="w-4 h-4" />
                <span>Add to Daily Food Log</span>
              </Button>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}
