import { motion } from 'motion/react';
import { 
  Wifi, Shield, Sparkles, Coffee, Star, CheckCircle, 
  MapPin, Bed, Bath, Square, Car, Dumbbell, 
  Thermometer, Monitor, Heart, Share2,
  Maximize2, Mail, Phone
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type RoomOut = {
  room_id: number;
  property_id: number;
  room_number: string;
  rent_per_month: number;
  is_active: boolean;
  is_booked: boolean;
  next_available?: string | null;
  availability_text?: string | null;
};

type ReviewOut = {
  review_id: number;
  property_id: number;
  customer_id: number;
  rating: number;
  review_text?: string | null;
  review_date?: string | null;
  reviewer_name?: string | null;
};

type PropertyDetailModel = {
  property_id: number;
  owner_id: number;
  property_description: string;
  room_description?: string | null;
  property_type?: string | null;
  city?: string | null;
  address?: string | null;
  google_maps_link?: string | null;
  verification_status?: string | null;
  average_rating?: number | null;
  is_full?: boolean;
  rooms_available?: number;
  next_available?: string | null;
  availability_text?: string | null;
  rooms?: RoomOut[] | null;
  reviews?: ReviewOut[] | null;
};


// Mock data for recommendations
const recommendations = [
  {
    id: 2,
    title: "Urban Heights",
    location: "Koramangala, Bangalore",
    price: "₹18,000",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
    type: "Premium PG",
    rating: 4.7
  },
  {
    id: 3,
    title: "Azure Living",
    location: "Whitefield, Bangalore",
    price: "₹22,000",
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop",
    type: "Co-living",
    rating: 4.8
  },
  {
    id: 4,
    title: "The Minimalist",
    location: "HSR Layout, Bangalore",
    price: "₹28,000",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070&auto=format&fit=crop",
    type: "Studio",
    rating: 4.9
  }
];

// Mock data for reviews
const reviews = [
  {
    id: 1,
    name: "Emily Watson",
    date: "October 2023",
    rating: 5,
    comment: "Absolutely stunning property. The amenities are top-notch and the location is perfect. The management team was very responsive.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Michael Chen",
    date: "September 2023",
    rating: 4,
    comment: "Great place to live. The gym is well-equipped and the pool is always clean. Only minor issue was some noise from the street on weekends.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Sarah Johnson",
    date: "August 2023",
    rating: 5,
    comment: "I've lived here for 6 months and I love it. The apartment is spacious and modern. Highly recommend!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1770&auto=format&fit=crop"
  }
];

export default function PropertyDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PropertyDetailModel | null>(null);
  const navigate = useNavigate();

  // Booking form state
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch(`/properties/${id}`)
      .then((res) => setData(res))
      .catch((e) => setError(e?.message || 'Failed to load property'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pt-32 text-center">Loading property…</div>;
  if (error) return <div className="pt-32 text-center text-red-600">{error}</div>;
  if (!data) return <div className="pt-32 text-center">Property not found</div>;

  // Local sample images
  const localImages = ['/images/unsplash1.jpg','/images/unsplash2.jpg','/images/unsplash3.jpg','/images/unsplash4.jpg','/images/unsplash5.jpg'];
  // Unsplash hotlink fallbacks (user-provided IDs)
  const unsplashIds = ['nmKPgfIUYtM', 'umAXneH4GhA', 'hlOpCML8twI'];
  const pickLocal = (seed?: number) => {
    if (!seed) return localImages[0];
    const idx = (Math.abs(seed - 1)) % localImages.length;
    return localImages[idx];
  };

  const mainImage = data.image_url || data.google_maps_link || pickLocal(data.property_id);

  return (
    <div className="pt-32 pb-20 px-4 md:px-12 min-h-screen bg-bone">
      <div className="max-w-7xl mx-auto">

        {/* Gallery Section */}
        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[500px] mb-12 rounded-3xl overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="col-span-4 md:col-span-2 row-span-2 relative group"
          >
            <img
              src={mainImage}
              className="w-full h-full object-cover"
              alt="Main"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                const src = el.src || '';
                const m = src.match(/unsplash(\d+)\.jpg$/);
                if (m) {
                  const num = Number(m[1]);
                  if (num >= 1 && num < localImages.length) {
                    el.src = `/images/unsplash${num + 1}.jpg`;
                    return;
                  }
                  const idx = data.property_id ? ((data.property_id - 1) % unsplashIds.length) : 0;
                  el.src = `https://source.unsplash.com/${unsplashIds[idx]}/1600x900`;
                  return;
                }
                el.src = localImages[0];
              }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
          </motion.div>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 * (i + 1) }}
              className="col-span-2 md:col-span-1 row-span-1 relative group"
            >
              <img
                src={mainImage}
                className="w-full h-full object-cover"
                alt={`Detail ${i+1}`}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  const src = el.src || '';
                  const m = src.match(/unsplash(\d+)\.jpg$/);
                  if (m) {
                    const num = Number(m[1]);
                    if (num >= 1 && num < localImages.length) {
                      el.src = `/images/unsplash${num + 1}.jpg`;
                      return;
                    }
                    const idx = data.property_id ? ((data.property_id - 1) % unsplashIds.length) : 0;
                    el.src = `https://source.unsplash.com/${unsplashIds[idx]}/1600x900`;
                    return;
                  }
                  el.src = localImages[0];
                }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
            </motion.div>
          ))}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="col-span-2 md:col-span-1 row-span-1 relative group cursor-pointer"
          >
            <img
              src={mainImage}
              className="w-full h-full object-cover"
              alt="Detail 4"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                const src = el.src || '';
                const idx = data.property_id ? ((data.property_id - 1) % unsplashIds.length) : 0;
                if (src.endsWith('/unsplash1.jpg')) { el.src = '/images/unsplash2.jpg'; return; }
                if (src.endsWith('/unsplash2.jpg')) { el.src = '/images/unsplash3.jpg'; return; }
                if (src.endsWith('/unsplash3.jpg')) { el.src = `https://source.unsplash.com/${unsplashIds[idx]}/1600x900`; return; }
                el.src = '/images/unsplash1.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-white hover:text-charcoal transition-all">
                <Maximize2 className="w-4 h-4" />
                Show all photos
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Title & Actions */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-serif text-3xl md:text-5xl text-charcoal mb-2">{data.property_description}</h1>
                <p className="font-sans text-charcoal/60 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-charcoal/40" />
                  {data.city || data.address}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 rounded-full border border-charcoal/10 hover:bg-charcoal hover:text-white transition-colors text-charcoal/60">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-full border border-charcoal/10 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors text-charcoal/60">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-lg text-charcoal/80 font-sans max-w-none">
              <h3 className="font-serif text-2xl text-charcoal mb-4">Description</h3>
              <p className="leading-relaxed">{data.room_description}</p>
            </div>

            {/* Rooms */}
            <div>
              <h3 className="font-serif text-2xl text-charcoal mb-6">Rooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.rooms && data.rooms.length ? data.rooms.map((r) => (
                  <div key={r.room_id} className="p-4 bg-white rounded-xl border border-charcoal/5 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-charcoal">{r.room_number || `Room ${r.room_id}`}</div>
                      <div className="text-xs text-charcoal/60">₹{(r.rent_per_month ?? 0).toLocaleString()}/mo</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-charcoal/60">{r.is_booked ? 'Booked' : 'Available'}</div>
                      {r.next_available && <div className="text-[10px] text-charcoal/50">{r.next_available}</div>}
                    </div>
                  </div>
                )) : <div className="text-charcoal/60">No rooms</div>}
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-8">
              
              {/* Price Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-charcoal/5 border border-charcoal/5">
                <div className="mb-6">
                  <span className="text-charcoal/60 text-sm block mb-1">Availability</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-serif text-charcoal">{data.availability_text || (data.rooms_available ? `${data.rooms_available} rooms` : '—')}</span>
                  </div>
                </div>

                {/* Booking form for customers */}
                {data.rooms && data.rooms.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    <label className="text-xs text-charcoal/60">Select room</label>
                    <select className="w-full p-3 border rounded" value={selectedRoom ?? ''} onChange={(e) => setSelectedRoom(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Choose a room</option>
                      {data.rooms.map((r) => (
                        <option key={r.room_id} value={r.room_id} disabled={r.is_booked}>{`${r.room_number} — ₹${r.rent_per_month}/mo ${r.is_booked ? '(Booked)' : ''}`}</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <input className="p-3 border rounded" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      <input className="p-3 border rounded" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>

                    <button
                      onClick={async () => {
                        setBookingStatus(null);
                        if (!selectedRoom || !startDate || !endDate) {
                          setBookingStatus('Select room and both dates');
                          return;
                        }
                        try {
                          const payload = { room_id: selectedRoom, start_date: startDate, end_date: endDate };
                          const res: any = await apiFetch(`/properties/${id}/bookings`, { method: 'POST', body: JSON.stringify(payload) });
                          setBookingStatus('Booking successful');
                          // navigate to booking detail
                          if (res && res.booking_id) navigate(`/booking/${res.booking_id}`);
                        } catch (err: any) {
                          setBookingStatus(err?.body || err?.message || 'Booking failed');
                        }
                      }}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-sans text-sm font-bold hover:bg-green-700 transition-colors"
                    >
                      Book Now
                    </button>

                    {bookingStatus && <div className="text-xs text-charcoal/60 mt-2">{bookingStatus}</div>}
                  </div>
                ) : (
                  <button className="w-full border border-charcoal text-charcoal py-4 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-charcoal/5 transition-colors mb-3">
                    Contact Owner
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Reviews Section */}
        <div className="mt-20 border-t border-charcoal/10 pt-16">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-4">Resident Reviews</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-6 h-6 text-gold fill-gold" />
                  <span className="text-2xl font-bold text-charcoal">{data.average_rating ?? '—'}</span>
                </div>
                <span className="text-charcoal/60 text-sm">Based on {data.reviews?.length ?? 0} reviews</span>
              </div>
            </div>
            {/* review button removed; reviews are left from Dashboard completed bookings */}
          </div>
          

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.reviews && data.reviews.length ? data.reviews.map((review) => (
              <div key={review.review_id} className="bg-white p-8 rounded-3xl border border-charcoal/5 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-charcoal/5 flex items-center justify-center text-white">{(review.reviewer_name || 'U').charAt(0)}</div>
                  <div>
                    <h4 className="font-bold text-charcoal">{review.reviewer_name}</h4>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">{review.review_date}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-gold fill-gold' : 'text-charcoal/20'}`} 
                    />
                  ))}
                </div>
                <p className="text-charcoal/70 leading-relaxed text-sm">"{review.review_text}"</p>
              </div>
            )) : <div className="text-charcoal/60">No reviews yet.</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
