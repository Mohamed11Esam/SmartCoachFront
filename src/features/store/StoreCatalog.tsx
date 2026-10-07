import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Star,
  Plus,
  Check,
  Search,
  Filter,
  Eye,
  Tag,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Product } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/utils';
import api from '../../lib/axios';

export const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  shaker: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
  bands: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=800',
  whey: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800',
  protein: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800',
  preworkout: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800',
  belt: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
  tee: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
  dumbbells: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&q=80&w=800',
  creatine: 'https://images.unsplash.com/photo-1616803689943-5601631c7fec?auto=format&fit=crop&q=80&w=800',
  default: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=800',
};

const SKU_IMAGE_MAP: Record<string, string> = {
  'ACC-001': PRODUCT_IMAGE_FALLBACKS.shaker,
  'EQP-001': PRODUCT_IMAGE_FALLBACKS.bands,
  'SUP-001': PRODUCT_IMAGE_FALLBACKS.whey,
  'SUP-002': PRODUCT_IMAGE_FALLBACKS.creatine,
  'SUP-003': PRODUCT_IMAGE_FALLBACKS.preworkout,
  'EQP-002': PRODUCT_IMAGE_FALLBACKS.dumbbells,
  'APP-001': PRODUCT_IMAGE_FALLBACKS.tee,
  'APP-002': PRODUCT_IMAGE_FALLBACKS.tee,
  'ACC-002': PRODUCT_IMAGE_FALLBACKS.belt,
};

export function getProductFallbackImage(product: {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
}): string {
  if (product.sku && SKU_IMAGE_MAP[product.sku]) {
    return SKU_IMAGE_MAP[product.sku];
  }
  const query = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  if (query.includes('shaker')) return PRODUCT_IMAGE_FALLBACKS.shaker;
  if (query.includes('band')) return PRODUCT_IMAGE_FALLBACKS.bands;
  if (query.includes('creatine')) return PRODUCT_IMAGE_FALLBACKS.creatine;
  if (query.includes('whey') || query.includes('protein') || query.includes('iso')) return PRODUCT_IMAGE_FALLBACKS.whey;
  if (query.includes('pre-workout') || query.includes('preworkout') || query.includes('energy')) return PRODUCT_IMAGE_FALLBACKS.preworkout;
  if (query.includes('belt') || query.includes('glove')) return PRODUCT_IMAGE_FALLBACKS.belt;
  if (query.includes('tee') || query.includes('shirt') || query.includes('compression') || query.includes('legging') || query.includes('apparel')) return PRODUCT_IMAGE_FALLBACKS.tee;
  if (query.includes('dumbbell') || query.includes('weight')) return PRODUCT_IMAGE_FALLBACKS.dumbbells;
  return PRODUCT_IMAGE_FALLBACKS.default;
}

export function resolveProductImage(product: Product): string {
  const currentImg = product.images?.[0];
  // Replace missing image or Curology bottle mismatch ('photo-1556228578-0d85b1a4d571')
  if (!currentImg || currentImg.includes('photo-1556228578-0d85b1a4d571')) {
    return getProductFallbackImage(product);
  }
  return currentImg;
}

const STORE_TABS = [
  { id: 'all', label: 'All Gear & Fuel' },
  { id: 'supplements', label: 'Supplements' },
  { id: 'equipment', label: 'Equipment & Belts' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'accessories', label: 'Accessories' },
];

export function StoreCatalog() {
  const { addItem, openCart } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');

  // Product Inspection Modal
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/products');
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products
    .filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      const priceA = a.salePrice ?? a.price;
      const priceB = b.salePrice ?? b.price;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      return 0;
    });

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery.trim() !== '' || sortBy !== 'featured';

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  const handleQuickAdd = (product: Product) => {
    const flavor = product.flavors ? product.flavors[0] : undefined;
    const size = product.sizes ? product.sizes[0] : undefined;
    addItem(product, 1, flavor, size);

    setAddedNotice(product._id);
    setTimeout(() => setAddedNotice(null), 1500);
  };

  const handleOpenInspect = (product: Product) => {
    setInspectProduct(product);
    setSelectedFlavor(product.flavors ? product.flavors[0] : '');
    setSelectedSize(product.sizes ? product.sizes[0] : '');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" size="sm">
              Performance Fuel & Equipment
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            APEX Athletic Official Store
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Tested, pharmaceutical-grade supplements and athlete training gear engineered for maximum progress.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={openCart}
          className="gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-accent" />
          <span>View Cart</span>
        </Button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <Tabs
          tabs={STORE_TABS}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          className="w-full lg:w-auto"
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-input-bg border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden flex flex-col justify-between border-border/80 animate-pulse"
            >
              <div>
                <div className="aspect-square w-full bg-main border-b border-border/60" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-border/60 rounded w-3/4" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-border/40 rounded w-full" />
                    <div className="h-3 bg-border/40 rounded w-5/6" />
                  </div>
                  <div className="h-2.5 bg-border/30 rounded w-1/3" />
                </div>
              </div>
              <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-border/40 pt-4">
                <div className="space-y-1">
                  <div className="h-4 bg-border/60 rounded w-16" />
                  <div className="h-2.5 bg-border/40 rounded w-20" />
                </div>
                <div className="h-8 bg-border/60 rounded-xl w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-main border border-border flex items-center justify-center mb-4 text-text-muted">
            <ShoppingBag className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">No products found</h3>
          <p className="text-sm text-text-secondary max-w-md mb-6">
            {hasActiveFilters
              ? "We couldn't find any products matching your selected filters or search query."
              : 'There are currently no products available in the store catalog.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isAdded = addedNotice === product._id;
            const hasDiscount = !!product.salePrice;

            return (
              <Card
                key={product._id}
                hoverEffect
                className="overflow-hidden flex flex-col justify-between group border-border/80"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative aspect-square w-full bg-main overflow-hidden border-b border-border/60">
                    <img
                      src={resolveProductImage(product)}
                      alt={product.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(product);
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      {hasDiscount && (
                        <span className="bg-accent text-black font-extrabold text-[11px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          SALE
                        </span>
                      )}
                      <span className="bg-black/75 backdrop-blur-md text-white/90 border border-white/10 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full">
                        {product.category}
                      </span>
                    </div>

                    {/* Rating pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10">
                      {product.averageRating > 0 ? (
                        <>
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          <span className="text-white font-bold">{product.averageRating.toFixed(1)}</span>
                          <span className="text-text-muted text-[10px]">({product.reviewCount})</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-accent" />
                          <span className="text-accent font-semibold text-[10px]">New Release</span>
                        </>
                      )}
                    </div>

                    {/* Quick Inspect Hover Trigger */}
                    <button
                      onClick={() => handleOpenInspect(product)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 py-1.5 px-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-black hover:scale-105 shadow-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Quick View</span>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Variant hints: badges & summary */}
                    {((product.flavors && product.flavors.length > 0) || (product.sizes && product.sizes.length > 0)) && (
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        {product.flavors && product.flavors.slice(0, 2).map((fl) => (
                          <span
                            key={fl}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-main text-text-secondary border border-border/80 font-medium"
                          >
                            {fl}
                          </span>
                        ))}
                        {product.flavors && product.flavors.length > 2 && (
                          <span className="text-[10px] text-text-muted">
                            +{product.flavors.length - 2} flavors
                          </span>
                        )}

                        {product.sizes && product.sizes.slice(0, 3).map((sz) => (
                          <span
                            key={sz}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-main text-text-secondary border border-border/80 font-medium"
                          >
                            {sz}
                          </span>
                        ))}
                        {product.sizes && product.sizes.length > 3 && (
                          <span className="text-[10px] text-text-muted">
                            +{product.sizes.length - 3} sizes
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Add to Cart Footer */}
                <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-border/40 pt-4">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-text-primary">
                        {formatCurrency(product.salePrice ?? product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-text-muted line-through font-medium">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-[10px] text-status-approved font-semibold mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-approved mr-1.5 animate-pulse" />
                      <span>In Stock ({product.stock} available)</span>
                    </div>
                  </div>

                  <Button
                    variant={isAdded ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleQuickAdd(product)}
                    className="gap-1.5 font-semibold"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {inspectProduct && (
        <Modal
          isOpen={true}
          onClose={() => setInspectProduct(null)}
          title={inspectProduct.name}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Rich product preview with clean aspect-square container */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-main border border-border relative group">
              <img
                src={resolveProductImage(inspectProduct)}
                alt={inspectProduct.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(inspectProduct);
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                {inspectProduct.salePrice && (
                  <span className="bg-accent text-black font-extrabold text-[11px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                    SALE
                  </span>
                )}
                <span className="bg-black/75 backdrop-blur-md text-white/90 border border-white/10 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full">
                  {inspectProduct.category}
                </span>
              </div>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                {/* Price display with current price, strikethrough original, & discount percentage badge */}
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl font-black text-text-primary">
                    {formatCurrency(inspectProduct.salePrice ?? inspectProduct.price)}
                  </span>
                  {inspectProduct.salePrice && (
                    <>
                      <span className="text-sm text-text-muted line-through font-medium">
                        {formatCurrency(inspectProduct.price)}
                      </span>
                      <span className="bg-accent text-black font-extrabold text-[11px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                        Save {Math.round(((inspectProduct.price - inspectProduct.salePrice) / inspectProduct.price) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Rating badge & In-stock badge */}
                <div className="flex flex-wrap items-center gap-3">
                  {inspectProduct.averageRating > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-main border border-border">
                      <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                      <span className="text-text-primary font-bold">{inspectProduct.averageRating.toFixed(1)}</span>
                      <span className="text-text-muted text-[10px]">({inspectProduct.reviewCount} reviews)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span className="text-accent font-semibold text-[11px]">New Release</span>
                    </div>
                  )}

                  <div className="flex items-center text-xs font-semibold text-status-approved">
                    <span className="inline-block w-2 h-2 rounded-full bg-status-approved mr-1.5 animate-pulse" />
                    <span>In Stock ({inspectProduct.stock} available)</span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {inspectProduct.description}
                </p>

                {/* Flavors selector */}
                {inspectProduct.flavors && inspectProduct.flavors.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-wider">
                      Choose Flavor {selectedFlavor && <span className="text-accent lowercase font-normal">({selectedFlavor})</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {inspectProduct.flavors.map((fl) => {
                        const isSelected = selectedFlavor === fl;
                        return (
                          <button
                            key={fl}
                            type="button"
                            onClick={() => setSelectedFlavor(fl)}
                            className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-accent text-black font-bold border-accent shadow-sm'
                                : 'bg-main border-border text-text-secondary hover:text-text-primary hover:border-text-muted'
                            }`}
                          >
                            {fl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes selector */}
                {inspectProduct.sizes && inspectProduct.sizes.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5 tracking-wider">
                      Choose Size {selectedSize && <span className="text-accent font-normal">({selectedSize})</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {inspectProduct.sizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-accent text-black font-bold border-accent shadow-sm'
                                : 'bg-main border-border text-text-secondary hover:text-text-primary hover:border-text-muted'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Specifications: clean key-value table */}
                {inspectProduct.specifications && Object.keys(inspectProduct.specifications).length > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Specifications
                    </h4>
                    <div className="rounded-xl border border-border/60 bg-main/50 overflow-hidden divide-y divide-border/40">
                      {Object.entries(inspectProduct.specifications).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center px-3.5 py-2 text-xs">
                          <span className="text-text-muted font-medium">{key}</span>
                          <span className="text-text-primary font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full "Add to Shopping Cart" button with cart icon */}
              <Button
                variant="accent-glow"
                size="lg"
                className="w-full mt-4 font-bold gap-2"
                onClick={() => {
                  addItem(inspectProduct, 1, selectedFlavor || undefined, selectedSize || undefined);
                  setInspectProduct(null);
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Shopping Cart</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
