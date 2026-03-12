import { motion } from 'motion/react';
import { CheckCircle, Calendar, MapPin, Star, Clock, ArrowRight, MessageSquarePlus, Shield, Phone, Mail, FileText, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

// Mock Data matching the schema
const mockDbData = {
  customer: { 
    fullName: 'Basantia Pramag', 
    email: 'basantiapramag@gmail.com', 
    verificationStatus: 'Verified' 
  },
  activeBooking: { 
    id: 'XM-8921-A',
    city: 'Bangalore', 
    propertyType: 'The Kensington Suite', 
    roomNumber: 'A-402', 
    rentPerMonth: 45000, 
    startDate: '2026-03-01', 
    endDate: '2026-08-31', 
    bookingStatus: 'Active',
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop"
  },
  bookingHistory: [
    { id: 'XM-7742-B', city: 'Mumbai', propertyType: 'Luxury PG', roomNumber: 'B-101', startDate: '2025-01-10', endDate: '2025-06-10', bookingStatus: 'Completed' },
    { id: 'XM-6631-C', city: 'Delhi', propertyType: 'Studio', roomNumber: 'S-205', startDate: '2024-06-01', endDate: '2024-12-01', bookingStatus: 'Completed' },
    { id: 'XM-5520-D', city: 'Bangalore', propertyType: 'Co-living', roomNumber: 'C-304', startDate: '2023-01-15', endDate: '2023-05-15', bookingStatus: 'Completed' }
  ],
  myReviews: [
    { bookingId: 'XM-7742-B', city: 'Mumbai', rating: 5, reviewText: 'Exceptional standard of living.Exceptional standard of living.Exceptional standard of living.Exceptional standard of living.Exceptional standard of living.Exceptional standard of living.', reviewDate: '2025-06-12' },
    { bookingId: 'XM-6631-C', city: 'Delhi', rating: 5, reviewText: 'Seamless experience from start to finish.', reviewDate: '2024-12-05' }
  ]
};

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
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);

  // Use mock data as fallback
  const customerData = user ? { fullName: (user as any).fullName || 'Resident', email: (user as any).email || '' } : { fullName: 'Resident', email: '' };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch customer's bookings
        const bookings: any[] = await apiFetch('/customer/mybookings').catch(() => []);

        if (!mounted) return;

        // fetch property details for each booking in parallel
        const propIds = Array.from(new Set(bookings.map(b => b.property_id).filter(Boolean)));
        const propsMap: Record<number, any> = {};
        await Promise.all(propIds.map(async (pid) => {
          try {
            const p = await apiFetch(`/properties/${pid}`);
            propsMap[pid] = p;
          } catch {
            propsMap[pid] = null;
          }
        }));

        // map bookings to include property metadata
        const mapped = bookings.map(b => ({
          ...b,
          property: propsMap[b.property_id] || null,
        }));

        const active = mapped.find(b => b.booking_status && b.booking_status.toLowerCase() === 'active') || null;
        const history = mapped.filter(b => !(b.booking_status && b.booking_status.toLowerCase() === 'active'));

        setActiveBooking(active);
        setBookingHistory(history);
        // reviews can be read from property details' reviews or left empty for now
        const reviews: any[] = [];
        setMyReviews(reviews);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="min-h-screen bg-bone pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Identity Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-5xl md:text-6xl text-charcoal">
                {customerData.fullName}
              </h1>
              {customerData.verificationStatus === 'Verified' && (
                <div className="bg-gold/10 text-gold p-1.5 rounded-full" title="Verified Resident">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            <p className="font-sans text-charcoal/40 text-sm tracking-wide uppercase">
              Resident ID: <span className="text-charcoal font-mono">RES-8829-X</span> • {customerData.email}
            </p>
          </div>
          
          <div className="flex gap-3">
             <button className="px-6 py-3 rounded-full border border-charcoal/10 hover:bg-charcoal hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                <Shield className="w-4 h-4" /> Support
             </button>
             <Link to="/my-properties">
               <button className="px-6 py-3 rounded-full bg-charcoal text-white hover:bg-black transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                  <Home className="w-4 h-4" /> Your Property
               </button>
             </Link>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          
          {/* Section 1: Active Lease (Hero Card) */}
          <motion.div variants={itemVariants} className="w-full">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="font-serif text-2xl text-charcoal">Current Residence</h2>
            </div>

                <div className="bg-white rounded-[2.5rem] p-3 shadow-xl shadow-charcoal/5 border border-charcoal/5 overflow-hidden">
                  {loading ? (
                    <div className="p-8 text-center">Loading current residence…</div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-600">{error}</div>
                  ) : activeBooking ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">
                      {/* Image Side */}
                      <div className="lg:col-span-5 relative h-64 lg:h-auto rounded-[2rem] overflow-hidden group">
                        <img
                          src={(activeBooking.property && activeBooking.property.property_description) ? (activeBooking.property.google_maps_link || '') : ''}
                          alt={activeBooking.property?.property_description || 'Property'}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/unsplash1.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-6 left-6 text-white">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Unit {activeBooking.room_number || activeBooking.room_number}</p>
                          <p className="font-serif text-2xl">{activeBooking.property?.city || activeBooking.city}</p>
                        </div>
                      </div>

                      {/* Details Side */}
                      <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h3 className="font-serif text-3xl md:text-4xl text-charcoal mb-2">{activeBooking.property?.property_description || activeBooking.property?.room_description || 'Your Residence'}</h3>
                            <div className="flex items-center gap-2 text-charcoal/60 text-sm">
                              <MapPin className="w-4 h-4" />
                              {activeBooking.property?.city || activeBooking.city}, India
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-1">Monthly Rent</p>
                            <p className="font-sans text-3xl text-charcoal">₹{(activeBooking.property?.average_rent ?? 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 py-8 border-y border-charcoal/5">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Start Date</p>
                            <p className="font-mono text-sm text-charcoal">{activeBooking.start_date}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> End Date</p>
                            <p className="font-mono text-sm text-charcoal">{activeBooking.end_date}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Residence Id</p>
                            <p className="font-mono text-sm text-charcoal">{activeBooking.booking_id}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button className="flex-1 bg-charcoal text-white py-4 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-black transition-colors">
                            Extend Lease
                          </button>
                          <button className="flex-1 border border-charcoal/20 text-charcoal py-4 rounded-xl font-sans text-xs uppercase tracking-widest font-bold hover:bg-charcoal/5 transition-colors">
                            Cancel Lease
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">No active bookings</div>
                  )}
                </div>
          </motion.div>

          {/* Section 2: Past Bookings & History */}
          <motion.div variants={itemVariants} className="w-full">
            <h2 className="font-serif text-2xl text-charcoal mb-6 px-2">Residence History</h2>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-charcoal/5 border border-charcoal/5">
              <div className="space-y-8">
                {loading ? (
                  <div className="p-8 text-center">Loading history…</div>
                ) : bookingHistory.length === 0 ? (
                  <div className="p-8 text-center">No past bookings</div>
                ) : (
                  bookingHistory.map((booking, index) => {
                    const review = myReviews.find((r) => r.bookingId === booking.booking_id || r.bookingId === booking.booking_id);
                    return (
                      <div key={index} className="group">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                          <div className="md:w-48 shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 block mb-1">Period</span>
                            <div className="font-mono text-xs text-charcoal/80">
                              {booking.start_date} <br/>
                              <span className="text-charcoal/30">↓</span> <br/>
                              {booking.end_date}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-baseline gap-3 mb-2">
                              <h3 className="font-serif text-xl text-charcoal group-hover:text-gold transition-colors">{booking.property?.property_description || 'Property'}</h3>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">{booking.property?.city || ''}</span>
                            </div>
                            <p className="text-sm text-charcoal/60 mb-4">Unit {booking.room_number || booking.room_number} • {booking.booking_id}</p>

                            {review ? (
                              <div className="bg-bone rounded-xl p-4 border border-charcoal/5 inline-block max-w-xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'text-gold fill-gold' : 'text-charcoal/20'}`} />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Your Review</span>
                                </div>
                                <p className="text-sm text-charcoal/80 italic">"{review.reviewText}"</p>
                              </div>
                            ) : (
                              <button className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal border border-dashed border-charcoal/20 px-4 py-3 rounded-xl hover:border-charcoal/40 hover:bg-white transition-all flex items-center gap-2">
                                <MessageSquarePlus className="w-4 h-4" /> Write a Review
                              </button>
                            )}
                          </div>

                          <div className="shrink-0">
                            <button className="p-3 rounded-full border border-charcoal/10 text-charcoal/40 hover:text-charcoal hover:border-charcoal transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {index !== bookingHistory.length - 1 && (
                          <div className="h-px w-full bg-charcoal/5 my-8" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
