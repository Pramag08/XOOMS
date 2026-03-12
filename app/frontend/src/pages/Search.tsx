import SearchPill from '@/components/SearchPill';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Filter, ArrowUp, ArrowDown, Star, Calendar, CheckCircle } from 'lucide-react';

// Local sample images placed in public/images
const localImages = [
  '/images/unsplash1.jpg',
  '/images/unsplash2.jpg',
  '/images/unsplash3.jpg',
  '/images/unsplash4.jpg',
  '/images/unsplash5.jpg',
];

// Hotlink Unsplash IDs provided earlier (used only as final fallback)
const unsplashIds = ['nmKPgfIUYtM', 'umAXneH4GhA', 'hlOpCML8twI'];

function getPlaceholderImage(id?: number) {
  if (!id) return localImages[0];
  // deterministic distribution across local images so properties don't all show same image
  const idx = (Math.abs(id - 1)) % localImages.length;
  return localImages[idx];
}

// frontend representation mapped from backend `PropertyRead`
type FrontProp = {
  id: number;
  title: string;
  location: string;
  price: number | null;
  image: string | null;
  type?: string | null;
  rating: number | null;
};

const initialProps: FrontProp[] = [];

export default function Search() {
  const [searchParams] = useSearchParams();
  const [isReset, setIsReset] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [properties, setProperties] = useState<FrontProp[]>(initialProps);
  const [searchQuery, setSearchQuery] = useState<string>(isReset ? "" : "");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [availableTo, setAvailableTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Filter States
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [minRating, setMinRating] = useState(0);
  
  // Sort State
  const [sortOption, setSortOption] = useState('newest');

  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      handleReset();
    }
  }, [searchParams]);

  // Initialize search state from URL query params when present
  useEffect(() => {
    const q = searchParams.get('q');
    const pt = searchParams.get('property_type');
    const af = searchParams.get('available_from');
    const at = searchParams.get('available_to');
    if (q || pt || af || at) {
      setSearchQuery(q || '');
      setFilterType(pt || null);
      setAvailableFrom(af || null);
      setAvailableTo(at || null);
    }
  }, [searchParams]);

  // fetch properties from backend (reacts to search and filter params)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const q = (searchQuery || '').trim();
    const params: string[] = [];
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (filterType) params.push(`property_type=${encodeURIComponent(filterType)}`);
    if (availableFrom && availableTo) {
      params.push(`available_from=${encodeURIComponent(availableFrom)}`);
      params.push(`available_to=${encodeURIComponent(availableTo)}`);
    }
    const qs = params.length ? `?${params.join('&')}` : '';
    apiFetch(`/properties${qs}`)
      .then((rows: any[]) => {
        if (!mounted) return;
        const mapped = (rows || []).map((p: any) => ({
          id: p.property_id,
          title: p.property_description || 'Untitled Property',
          location: p.city || p.address || '',
          price: p.average_rent ?? null,
          // backend may expose image_url or images array; fall back to google_maps_link or placeholder
          image: p.image_url || (p.images && p.images.length ? p.images[0] : (p.google_maps_link || getPlaceholderImage(p.property_id))),
          type: p.property_type || null,
          rating: p.average_rating ?? null,
        }));
        setProperties(mapped);
      })
      .catch((e) => {
        setError(e?.message || 'Failed to load properties');
      })
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [searchQuery, filterType, availableFrom, availableTo]);

  const handleReset = () => {
    setIsReset(true);
    setResetKey(prev => prev + 1);
    setPriceRange({ min: 0, max: 100000 });
    setMinRating(0);
    setSortOption('newest');
    setSearchQuery('');
  };

  const handleSearch = (payload: any) => {
    if (typeof payload === 'string') {
      setSearchQuery(payload || '');
      return;
    }
    setSearchQuery(payload.q || '');
    setFilterType(payload.property_type || null);
    setAvailableFrom(payload.available_from || null);
    setAvailableTo(payload.available_to || null);
  };

  const filteredProperties = properties
    .filter(p => {
      const parseNum = (v: any) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const cleaned = v.replace(/[,\s]/g, '');
          const n = Number(cleaned);
          return isNaN(n) ? 0 : n;
        }
        return 0;
      };
      const price = parseNum(p.price);
      const rating = parseNum(p.rating);
      return price >= priceRange.min && price <= priceRange.max && rating >= minRating;
    })
    .slice()
    .sort((a, b) => {
      const parseNum = (v: any) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const cleaned = v.replace(/[,\s]/g, '');
          const n = Number(cleaned);
          return isNaN(n) ? 0 : n;
        }
        return 0;
      };
      const aPrice = parseNum(a.price);
      const bPrice = parseNum(b.price);
      const aRating = parseNum(a.rating);
      const bRating = parseNum(b.rating);

      const compare = (x: number, y: number) => {
        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
      };

      switch (sortOption) {
        case 'price-asc': return compare(aPrice, bPrice);
        case 'price-desc': return compare(bPrice, aPrice);
        case 'rating-asc': return compare(aRating, bRating);
        case 'rating-desc': return compare(bRating, aRating);
        case 'newest': return compare(b.id, a.id);
        default: return 0;
      }
    });

  // Debugging output to help trace disappearing items
  // eslint-disable-next-line no-console
  console.debug('Search debug', { sortOption, rawCount: properties.length, filteredCount: filteredProperties.length, properties, filteredProperties });

  return (
    <div className="pt-48 pb-20 px-4 md:px-12 min-h-screen">
      <SearchPill 
        isFixed={true} 
        initialValue={searchQuery || ''} 
        placeholder="All locations" 
        onReset={handleReset}
        onSearch={handleSearch}
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <h1 className="font-serif text-3xl text-charcoal">
            <>
              <span className="italic">{filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}</span> found in {searchQuery && searchQuery.trim() ? searchQuery.trim() : 'All locations'}
            </>
          </h1>
          <div className="flex gap-2 relative">
            {/* Filter Button & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-4 py-2 rounded-full border transition-colors text-xs uppercase tracking-wider flex items-center gap-2 ${
                  isFilterOpen || minRating > 0 || priceRange.min > 0 || priceRange.max < 100000
                    ? 'bg-charcoal text-white border-charcoal' 
                    : 'border-charcoal/10 hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal'
                }`}
              >
                <Filter className="w-3 h-3" /> Filter
                {(minRating > 0 || priceRange.min > 0 || priceRange.max < 100000) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse ml-1" />
                )}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-charcoal/10 border border-charcoal/5 p-6 z-20"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif text-lg text-charcoal">Filters</h3>
                      <button onClick={() => { setPriceRange({min: 0, max: 100000}); setMinRating(0); }} className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal">Reset</button>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-3 block">Price Range</label>
                      <div className="flex gap-3 items-center mb-3">
                        <div className="bg-bone rounded-lg px-3 py-2 flex-1 flex items-center">
                          <span className="text-xs text-charcoal/40 mr-1">₹</span>
                          <input 
                            type="number" 
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
                            className="bg-transparent w-full text-sm font-bold text-charcoal focus:outline-none"
                          />
                        </div>
                        <span className="text-charcoal/20">-</span>
                        <div className="bg-bone rounded-lg px-3 py-2 flex-1 flex items-center">
                          <span className="text-xs text-charcoal/40 mr-1">₹</span>
                          <input 
                            type="number" 
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
                            className="bg-transparent w-full text-sm font-bold text-charcoal focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-3 block">Rating</label>
                      <div className="space-y-2">
                        {[4, 3, 2, 1].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                              minRating === rating ? 'bg-charcoal text-white' : 'hover:bg-bone text-charcoal/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-current' : 'opacity-20'}`} />
                                ))}
                              </div>
                              <span className="text-xs font-medium">& Up</span>
                            </div>
                            {minRating === rating && <CheckCircle className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Button & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="px-4 py-2 rounded-full border border-charcoal/10 hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <ArrowUp className="w-3 h-3" /> Sort
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-charcoal/10 border border-charcoal/5 p-2 z-20"
                  >
                    {[
                      { id: 'newest', label: 'Newest First', icon: Calendar },
                      { id: 'price-asc', label: 'Price: Low to High', icon: ArrowUp },
                      { id: 'price-desc', label: 'Price: High to Low', icon: ArrowDown },
                      { id: 'rating-asc', label: 'Rating: Low to High', icon: Star },
                      { id: 'rating-desc', label: 'Rating: High to Low', icon: Star },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => { setSortOption(option.id); setIsSortOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                          sortOption === option.id ? 'bg-charcoal text-white' : 'text-charcoal/60 hover:bg-bone'
                        }`}
                      >
                        <option.icon className="w-3 h-3" />
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div key={resetKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && <div className="col-span-full text-center py-12">Loading properties…</div>}
          {error && <div className="col-span-full text-center text-red-600 py-12">{error}</div>}
          {!loading && !error && filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Link to={`/property/${property.id}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4">
                  <img
                    src={property.image || getPlaceholderImage(property.id)}
                    alt={property.title}
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      const src = el.src || '';
                      // detect current local unsplashN and advance to next local image
                      const m = src.match(/unsplash(\d+)\.jpg$/);
                      if (m) {
                        const num = Number(m[1]);
                        if (num >= 1 && num < localImages.length) {
                          el.src = `/images/unsplash${num + 1}.jpg`;
                          return;
                        }
                        // exhausted local images -> fallback to hotlink
                        const idx = property.id ? ((property.id - 1) % unsplashIds.length) : 0;
                        el.src = `https://source.unsplash.com/${unsplashIds[idx]}/1600x900`;
                        return;
                      }
                      // initial failure or non-local src: start with first local image
                      el.src = localImages[0];
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal">Verified</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl text-charcoal group-hover:text-gold transition-colors">{property.title}</h3>
                    <p className="text-xs text-charcoal/60 font-sans mt-1">{property.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans font-medium text-charcoal">₹{(property.price ?? 0).toLocaleString()}<span className="text-charcoal/40 text-[10px] font-normal">/mo</span></p>
                    <p className="text-[10px] text-charcoal/60 mt-1">★ {property.rating ?? '—'}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
