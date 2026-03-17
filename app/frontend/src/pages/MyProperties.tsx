import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, 
  MapPin, Home, DollarSign, Calendar, ArrowLeft, ChevronDown, Star, X, ArrowUp, ArrowDown, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, Fragment } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '../context/AuthContext';

// Mock Data for User's Properties
const initialProperties = [
  {
    id: 'PROP-8821',
    name: 'The Kensington Suite',
    location: 'Indiranagar, Bangalore',
    type: 'Serviced Apartment',
    price: 45000,
    status: 'Active',
    listedDate: '12 Mar 2025',
    views: 1240,
    rating: 4.8,
    reviews: 24
  },
  {
    id: 'PROP-9932',
    name: 'Azure Heights Villa',
    location: 'Whitefield, Bangalore',
    type: '4BHK Villa',
    price: 85000,
    status: 'Pending',
    listedDate: '05 Mar 2026',
    views: 45,
    rating: 0,
    reviews: 0
  },
  {
    id: 'PROP-7721',
    name: 'Urban Studio Loft',
    location: 'Koramangala, Bangalore',
    type: 'Studio',
    price: 28000,
    status: 'Rented',
    listedDate: '10 Jan 2025',
    views: 892,
    rating: 4.5,
    reviews: 18
  },
  {
    id: 'PROP-6654',
    name: 'Greenwood Residency',
    location: 'HSR Layout, Bangalore',
    type: '3BHK Apartment',
    price: 32000,
    status: 'Active',
    listedDate: '28 Feb 2026',
    views: 356,
    rating: 4.2,
    reviews: 8
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export default function MyProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bookingsMap, setBookingsMap] = useState<Record<string, any[]>>({});
  const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Filter States
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [minRating, setMinRating] = useState(0);
  
  // Sort State
  const [sortOption, setSortOption] = useState('newest'); // newest, price-asc, price-desc, rating-asc, rating-desc

  // Apply Filters and Sort
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // only attempt when user is present
        if (!user) {
          if (mounted) setProperties([]);
          return;
        }
        const ownerProps: any[] = await apiFetch('/owner/properties').catch(() => []);
        if (!mounted) return;
        // map backend shape to UI shape expected by table
        const mapped = (ownerProps || []).map((p: any) => {
          const verStatus = p.verification_status ?? p.status ?? null;
          const verified = !!(
            (typeof verStatus === 'string' && /verif/i.test(verStatus)) ||
            p.is_verified === true ||
            p.verified === true
          );
          return ({
            id: p.property_id ?? `P-${Math.random().toString(36).slice(2,8)}`,
            name: p.property_description || 'Property',
            location: p.city || '',
            type: p.property_type || '',
            price: p.average_rent ?? 0,
            status: p.availability_text || (p.is_full ? 'Rented' : 'Active') || (verStatus || 'Active'),
            listedDate: p.next_available || '-',
            views: 0,
            rating: p.average_rating ?? 0,
            reviews: 0,
            verification_status: verStatus,
            verified,
            raw: p,
          });
        });
        setProperties(mapped);
        // fetch owner bookings once and group by property_id
        try {
          const ownerBookings: any[] = await apiFetch('/owner/bookings').catch(() => []);
          const grouped: Record<string, any[]> = {};
          (ownerBookings || []).forEach((b: any) => {
            const pid = String(b.property_id || '');
            if (!grouped[pid]) grouped[pid] = [];
            grouped[pid].push(b);
          });
          if (mounted) setBookingsMap(grouped);
        } catch (e) {
          // ignore booking fetch errors for now
        }
      } catch (err) {
        if (mounted) setError((err as any)?.message || 'Failed to load properties');
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  const toggleExpand = (propId: string) => {
    setExpandedProps(prev => ({ ...prev, [propId]: !prev[propId] }));
  };

  return (
    <div className="min-h-screen bg-bone pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-charcoal/40 hover:text-charcoal transition-colors mb-4 text-xs uppercase tracking-widest font-bold">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-2">
              My Properties
            </h1>
            <p className="font-sans text-charcoal/60 text-sm">
              Manage your listed properties, track status, and update details.
            </p>
          </div>
          
          <Link to="/my-properties/add">
            <button className="px-6 py-3 rounded-full bg-charcoal text-white hover:bg-black transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2 shadow-lg shadow-charcoal/20">
              <Plus className="w-4 h-4" /> Add New Property
            </button>
          </Link>
        </motion.div>

        {/* Controls Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl p-4 mb-8 shadow-sm border border-charcoal/5 flex flex-col md:flex-row gap-4 justify-between items-center"
        >
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <input 
              type="text" 
              placeholder="Search properties..." 
              className="w-full pl-10 pr-4 py-2.5 bg-bone/50 rounded-xl text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal/20 transition-all placeholder:text-charcoal/30"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto relative">
            {/* Filter Button & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-4 py-2.5 rounded-xl border transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
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
                className="px-4 py-2.5 rounded-xl border border-charcoal/10 hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-2"
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
        </motion.div>

        {/* Properties Table */}
        {loading ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-charcoal/5 border border-charcoal/5 p-12 text-center">Loading properties…</div>
        ) : !user ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-charcoal/5 border border-charcoal/5 p-12 text-center">Please <Link to="/login" className="underline">log in</Link> to manage your properties.</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl shadow-charcoal/5 border border-charcoal/5 p-12 text-center">No properties found.</div>
        ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-3xl shadow-xl shadow-charcoal/5 border border-charcoal/5 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-charcoal/5 bg-charcoal/[0.02]">
                  <th className="text-left py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 w-[30%]">Property Details</th>
                  <th className="text-left py-6 px-4 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Type</th>
                  <th className="text-left py-6 px-4 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Rent</th>
                  <th className="text-left py-6 px-4 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Status</th>
                  <th className="text-left py-6 px-4 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Rating</th>
                  <th className="text-left py-6 px-4 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Listed On</th>
                  <th className="text-right py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property, index) => (
                  <Fragment key={property.id}>
                  <motion.tr 
                    variants={itemVariants}
                    className={`group hover:bg-bone/30 transition-colors border-b border-charcoal/5 last:border-0 ${property.verified ? '' : 'opacity-70 grayscale'}`}
                  >
                    <td className="py-6 px-8">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-lg text-charcoal group-hover:text-gold transition-colors">{property.name}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${property.verified ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-charcoal/5 text-charcoal/60 border border-charcoal/10'}`}>
                            {property.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-charcoal/40 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs font-sans">{property.location}</span>
                        </div>
                        <span className="text-[10px] font-mono text-charcoal/30 mt-1 block">{property.id}</span>
                      </div>
                    </td>
                    
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2 text-charcoal/70">
                        <Home className="w-4 h-4 text-charcoal/30" />
                        <span className="text-sm font-medium">{property.type}</span>
                      </div>
                    </td>
                    
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-1 text-charcoal">
                        <span className="font-serif text-lg">₹{property.price.toLocaleString()}</span>
                        <span className="text-xs text-charcoal/40">/mo</span>
                      </div>
                    </td>
                    
                    <td className="py-6 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        property.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' :
                        property.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-charcoal/5 text-charcoal/60 border-charcoal/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          property.status === 'Active' ? 'bg-green-500 animate-pulse' :
                          property.status === 'Pending' ? 'bg-amber-500' :
                          'bg-charcoal/40'
                        }`} />
                        {property.status}
                      </span>
                    </td>

                    <td className="py-6 px-4">
                      <div className="flex items-center gap-1">
                        <Star className={`w-3 h-3 ${property.rating > 0 ? 'text-gold fill-gold' : 'text-charcoal/20'}`} />
                        <span className="text-sm font-bold text-charcoal">{property.rating > 0 ? property.rating : '-'}</span>
                        {property.reviews > 0 && (
                          <span className="text-[10px] text-charcoal/40">({property.reviews})</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2 text-charcoal/60">
                        <Calendar className="w-3 h-3 text-charcoal/30" />
                        <span className="text-xs font-mono">{property.listedDate}</span>
                      </div>
                    </td>
                    
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/owner/properties/${property.raw?.property_id || property.id}`} title="Manage Property" className="p-2 rounded-full hover:bg-charcoal/5 text-charcoal/40 hover:text-charcoal transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleExpand(String(property.raw?.property_id || property.id))}
                          title="Show bookings"
                          className="p-2 rounded-full hover:bg-charcoal/5 text-charcoal/40 hover:text-charcoal transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedProps[String(property.raw?.property_id || property.id)] ? 'rotate-180' : ''}`} />
                        </button>
                        <button 
                          onClick={async () => {
                            const confirmDel = window.confirm('Delete this property? This action cannot be undone.');
                            if (!confirmDel) return;
                            const propId = property.raw?.property_id;
                            if (!propId) { alert('Unable to determine property id'); return; }
                            // only admins can delete via API; owners cannot delete properties in backend
                            if (!(user && (user as any).role && String((user as any).role).toLowerCase() === 'admin')) {
                              alert('Only admins can delete properties. Please contact an administrator.');
                              return;
                            }
                            try {
                              setDeletingId(propId);
                              await apiFetch(`/admin/properties/${propId}`, { method: 'DELETE' });
                              setProperties(prev => prev.filter(p => p.raw?.property_id !== propId));
                            } catch (err: any) {
                              alert(err?.message || 'Failed to delete property');
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          className="p-2 rounded-full hover:bg-red-50 text-charcoal/40 hover:text-red-500 transition-colors"
                          title="Delete Property"
                        >
                          {deletingId === property.raw?.property_id ? <span className="text-xs">Deleting…</span> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <button 
                          className="p-2 rounded-full hover:bg-charcoal/5 text-charcoal/40 hover:text-charcoal transition-colors"
                          title="More Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  {expandedProps[String(property.raw?.property_id || property.id)] && (
                    <tr className="bg-bone/30 border-b border-charcoal/5">
                      <td colSpan={7} className="py-4 px-8">
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-charcoal">Bookings</h4>
                          {(bookingsMap[String(property.raw?.property_id || property.id)] || []).length === 0 ? (
                            <div className="text-sm text-charcoal/60">No bookings for this property.</div>
                          ) : (
                            <div className="space-y-2">
                              {(bookingsMap[String(property.raw?.property_id || property.id)] || []).map((b) => (
                                <div key={b.booking_id} className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-charcoal/5">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-charcoal">Room: {b.room_number || b.room_id}</div>
                                    <div className="text-xs text-charcoal/60">Guest: {b.customer_name || b.customer_id} • {b.booking_status}</div>
                                    <div className="text-xs text-charcoal/40">{b.start_date} → {b.end_date}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Link to={`/booking/${b.booking_id}`} className="px-3 py-1 rounded-lg text-xs border border-charcoal/10">View</Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination / Footer of Table */}
          <div className="bg-charcoal/[0.02] border-t border-charcoal/5 px-8 py-4 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Showing {filteredProperties.length} of {properties.length} Properties</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal disabled:opacity-50">Previous</button>
              <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-charcoal hover:bg-charcoal/5 rounded-lg">1</button>
              <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 rounded-lg">2</button>
              <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal hover:bg-charcoal/5 rounded-lg">3</button>
              <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal">Next</button>
            </div>
          </div>
        </motion.div>
        )}

      </div>
    </div>
  );
}
