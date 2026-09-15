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
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Product } from '../../types';
import { MOCK_PRODUCTS } from '../../lib/mockData';
import { useCartStore } from '../../stores/cartStore';
import { formatCurrency } from '../../lib/utils';
import api from '../../lib/axios';

const STORE_TABS = [
  { id: 'all', label: 'All Gear & Fuel' },
  { id: 'supplements', label: 'Supplements' },
  { id: 'equipment', label: 'Equipment & Belts' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'accessories', label: 'Accessories' },
];

export function StoreCatalog() {
  const { addItem, openCart } = useCartStore();

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
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
      try {
        const { data } = await api.get('/products');
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      } catch {
        // Fallback to mock products
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
                    src={product.images[0]}
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=500';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {hasDiscount && (
                      <Badge variant="accent" size="sm" className="font-bold">
                        SALE
                      </Badge>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-text-secondary border border-white/10">
                      {product.category}
                    </span>
                  </div>

                  {/* Rating pill */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-text-primary border border-white/10">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    <span>{product.averageRating}</span>
                    <span className="text-text-muted">({product.reviewCount})</span>
                  </div>

                  {/* Quick Inspect Hover Trigger */}
                  <button
                    onClick={() => handleOpenInspect(product)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 py-1.5 px-4 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-black"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Quick View</span>
                  </button>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Variant teaser */}
                  {product.flavors && (
                    <p className="text-[10px] text-text-muted truncate">
                      Flavors: {product.flavors.join(', ')}
                    </p>
                  )}
                  {product.sizes && (
                    <p className="text-[10px] text-text-muted truncate">
                      Sizes: {product.sizes.join(', ')}
                    </p>
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
                      <span className="text-xs text-text-muted line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-status-approved font-semibold">
                    In Stock ({product.stock} left)
                  </span>
                </div>

                <Button
                  variant={isAdded ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleQuickAdd(product)}
                  className="gap-1.5"
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

      {/* Product Detail Modal */}
      {inspectProduct && (
        <Modal
          isOpen={true}
          onClose={() => setInspectProduct(null)}
          title={inspectProduct.name}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="aspect-square rounded-xl overflow-hidden bg-main border border-border">
              <img
                src={inspectProduct.images[0]}
                alt={inspectProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-text-primary">
                    {formatCurrency(inspectProduct.salePrice ?? inspectProduct.price)}
                  </span>
                  {inspectProduct.salePrice && (
                    <span className="text-sm text-text-muted line-through">
                      {formatCurrency(inspectProduct.price)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {inspectProduct.description}
                </p>

                {/* Flavors */}
                {inspectProduct.flavors && (
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">
                      Choose Flavor
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectProduct.flavors.map((fl) => (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setSelectedFlavor(fl)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                            selectedFlavor === fl
                              ? 'bg-accent text-black font-bold border-accent'
                              : 'bg-main border-border text-text-secondary'
                          }`}
                        >
                          {fl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {inspectProduct.sizes && (
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1">
                      Choose Size
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectProduct.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-accent text-black font-bold border-accent'
                              : 'bg-main border-border text-text-secondary'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs */}
                {inspectProduct.specifications && (
                  <div className="pt-2 border-t border-border/60 space-y-1">
                    {Object.entries(inspectProduct.specifications).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs text-text-muted">
                        <span>{key}</span>
                        <span className="text-text-primary font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="accent-glow"
                size="lg"
                className="w-full mt-4"
                onClick={() => {
                  addItem(inspectProduct, 1, selectedFlavor, selectedSize);
                  setInspectProduct(null);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add to Shopping Cart</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
