import SearchPill from '@/components/SearchPill';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Filter, ArrowUp, ArrowDown, Star, Calendar, CheckCircle } from 'lucide-react';

const properties = [
  {
    id: 1,
    title: "The Kensington Suite",
    location: "Indiranagar, Bangalore",
    price: 35000,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop",
    type: "Serviced Apartment",
    rating: 4.9
  },
  {
    id: 2,
    title: "Urban Heights",
    location: "Koramangala, Bangalore",
    price: 18000,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
    type: "Premium PG",
    rating: 4.7
  },
  {
    id: 3,
    title: "Azure Living",
    location: "Whitefield, Bangalore",
    price: 22000,
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop",
    type: "Co-living",
    rating: 4.8
  },
  {
    id: 4,
    title: "The Minimalist",
    location: "HSR Layout, Bangalore",
    price: 28000,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070&auto=format&fit=crop",
    type: "Studio",
    rating: 4.9
  },
  {
    id: 5,
    title: "Garden View Residency",
    location: "Jayanagar, Bangalore",
    price: 15000,
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop",
    type: "Girls PG",
    rating: 4.6
  },
  {
    id: 6,
    title: "Tech Park Haven",
    location: "Electronic City, Bangalore",
    price: 20000,
    image: "https://images.unsplash.com/photo-1617104424032-b9bd6972d0e4?q=80&w=2070&auto=format&fit=crop",
    type: "Boys PG",
    rating: 4.5
  }
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const [isReset, setIsReset] = useState(false);
  const [resetKey, setResetKey] = useState(0);

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

  const handleReset = () => {
    setIsReset(true);
    setResetKey(prev => prev + 1);
    setPriceRange({ min: 0, max: 100000 });
    setMinRating(0);
    setSortOption('newest');
  };

  const filteredProperties = properties
    .filter(p => 
      p.price >= priceRange.min && 
      p.price <= priceRange.max && 
      p.rating >= minRating
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating-asc': return a.rating - b.rating;
        case 'rating-desc': return b.rating - a.rating;
        default: return 0;
      }
    });

  return (
    <div className="pt-48 pb-20 px-4 md:px-12 min-h-screen">
      <SearchPill 
        isFixed={true} 
        initialValue={isReset ? "" : "Bangalore"} 
        placeholder="Add location" 
        onReset={handleReset} 
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <h1 className="font-serif text-3xl text-charcoal">
            {isReset ? (
              <span className="italic">All properties</span>
            ) : (
              <>
                <span className="italic">{filteredProperties.length} properties</span> found in Bangalore
              </>
            )}
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
          {filteredProperties.map((property, index) => (
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
                    src={property.image} 
                    alt={property.title} 
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
                    <p className="font-sans font-medium text-charcoal">₹{property.price.toLocaleString()}<span className="text-charcoal/40 text-[10px] font-normal">/mo</span></p>
                    <p className="text-[10px] text-charcoal/60 mt-1">★ {property.rating}</p>
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
