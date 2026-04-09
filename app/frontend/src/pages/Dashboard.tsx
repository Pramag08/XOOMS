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
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Use mock data as fallback
  const customerData = user ? { fullName: (user as any).fullName || '', email: (user as any).email || '' } : { fullName: '', email: '' };

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
            // also fetch rooms for this property to obtain room-level rent
            const rooms = await apiFetch(`/properties/${pid}/rooms`).catch(() => []);
            propsMap[pid] = { property: p, rooms };
          } catch {
            propsMap[pid] = { property: null, rooms: [] };
          }
        }));

        // map bookings to include property metadata
        const mapped = bookings.map(b => {
          const pm = propsMap[b.property_id] || { property: null, rooms: [] };
          const room = (pm.rooms || []).find((r: any) => r.room_id === b.room_id) || null;
          return {
            ...b,
            property: pm.property || null,
            room,
          };
        });

        const activeList = mapped.filter(b => b.booking_status && b.booking_status.toLowerCase() === 'active');
        const history = mapped.filter(b => !(b.booking_status && b.booking_status.toLowerCase() === 'active'));

        setActiveBooking(activeList);
        setBookingHistory(history);

        // Attempt to detect existing reviews for past bookings by this user
        try {
          const reviewerName = customerData.fullName || '';
          const detectedReviews: any[] = [];
          // fetch reviews per property in parallel
          await Promise.all(history.map(async (hb) => {
            try {
              if (!hb.property || !hb.property.property_id) return;
              const revs: any[] = await apiFetch(`/properties/${hb.property.property_id}/reviews`).catch(() => []);
              const mine = (revs || []).find(r => (r.reviewer_name || '') === reviewerName);
              if (mine) {
                detectedReviews.push({ bookingId: hb.booking_id, city: hb.property?.city, rating: mine.rating, reviewText: mine.review_text, reviewDate: mine.review_date ? String(mine.review_date).split('T')[0] : null });
              }
            } catch (e) {
              // ignore per-property errors
            }
          }));

          // mark bookingHistory entries that have reviews
          const updatedHistory = history.map(hb => ({ ...hb, has_review: detectedReviews.some(r => r.bookingId === hb.booking_id) }));
          setBookingHistory(updatedHistory);
          setMyReviews(detectedReviews);
        } catch (e) {
          // ignore review discovery errors
          setMyReviews([]);
        }
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
             {(user && (user as any).role && String((user as any).role).toLowerCase() === 'owner') ? (
               <Link to="/my-properties">
                 <button className="px-6 py-3 rounded-full bg-charcoal text-white hover:bg-black transition-colors text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                    <Home className="w-4 h-4" /> Your Property
                 </button>
               </Link>
             ) : null}
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
              <h2 className="font-serif text-2xl text-charcoal">Current Bookings</h2>
            </div>

            <div className="bg-white rounded-[2.5rem] p-3 shadow-xl shadow-charcoal/5 border border-charcoal/5 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">Loading current bookings…</div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">{error}</div>
              ) : (Array.isArray(activeBooking) && activeBooking.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  {activeBooking.map((ab: any) => (
                      <div key={ab.booking_id} className="flex gap-4 bg-white rounded-xl p-4 border border-charcoal/5 shadow-sm">
                      <div className="w-36 h-28 rounded-lg overflow-hidden relative">
                        <img src={ab.property?.google_maps_link || '/images/unsplash1.jpg'} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/unsplash1.jpg'; }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-serif text-xl text-charcoal">{ab.property?.property_description || 'Property'}</h3>
                            <div className="text-sm text-charcoal/60">Unit {ab.room_number}</div>
                            <div className="text-xs text-charcoal/40">{ab.property?.city}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Monthly Rent</div>
                            <div className="font-sans text-2xl text-charcoal">₹{((ab.room && ab.room.rent_per_month) ?? ab.property?.average_rent ?? 0).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-charcoal/60">
                          {editingBookingId === ab.booking_id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="p-2 border rounded"
                                  type="date"
                                  value={editStartDate}
                                  onChange={(e) => setEditStartDate(e.target.value)}
                                  disabled={Boolean(ab?.booking_status && String(ab.booking_status).toLowerCase() === 'active')}
                                  title={ab?.booking_status && String(ab.booking_status).toLowerCase() === 'active' ? 'Start date cannot be changed for active bookings' : undefined}
                                />
                                <input className="p-2 border rounded" type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                              </div>
                              <div className="flex gap-2">
                                <button className="px-3 py-2 bg-charcoal text-white rounded" disabled={savingEdit} onClick={async () => {
                                  setEditError(null);
                                  setSavingEdit(true);
                                  try {
                                    const payload = { start_date: editStartDate, end_date: editEndDate };
                                    const res: any = await apiFetch(`/customer/mybookings/${ab.booking_id}`, { method: 'PUT', body: JSON.stringify(payload) });
                                    // update local state
                                    setActiveBooking((prev: any[]) => prev.map(p => p.booking_id === ab.booking_id ? { ...p, start_date: res.start_date, end_date: res.end_date } : p));
                                    setBookingHistory((prev: any[]) => prev.map(p => p.booking_id === ab.booking_id ? { ...p, start_date: res.start_date, end_date: res.end_date } : p));
                                    setEditingBookingId(null);
                                  } catch (err: any) {
                                    setEditError(err?.body || err?.message || 'Failed to save');
                                  } finally {
                                    setSavingEdit(false);
                                  }
                                }}>Save</button>
                                <button className="px-3 py-2 border rounded" onClick={() => { setEditingBookingId(null); setEditError(null); }}>{savingEdit ? 'Cancel' : 'Cancel'}</button>
                              </div>
                              {editError && <div className="text-xs text-red-600">{editError}</div>}
                            </div>
                          ) : (
                            <>
                              <div>From: <span className="font-mono">{ab.start_date}</span></div>
                              <div>To: <span className="font-mono">{ab.end_date}</span></div>
                              <div className="mt-2 text-xs text-charcoal/50">Booking ID: <span className="font-mono">{ab.booking_id}</span></div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {editingBookingId !== ab.booking_id ? (
                          <button className="px-3 py-2 border rounded text-sm" onClick={() => { setEditingBookingId(ab.booking_id); setEditStartDate(ab.start_date || ''); setEditEndDate(ab.end_date || ''); setEditError(null); }}>Edit</button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">No active bookings</div>
              )}
            </div>
          </motion.div>
          {/* Review Modal */}
          {showReviewModal && reviewBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => { if (!reviewSubmitting) setShowReviewModal(false); }} />
              <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg mx-4 z-50">
                <h3 className="font-serif text-xl mb-2">Leave a review for {reviewBooking.property?.property_description || 'the property'}</h3>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-charcoal/60">Rating</label>
                  <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="p-2 border rounded">
                    {[5,4,3,2,1].map((r) => (
                      <option key={r} value={r}>{r} ★</option>
                    ))}
                  </select>
                </div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={5} className="w-full p-3 border rounded mb-4" placeholder="Share your experience (optional)" />
                <div className="flex items-center gap-3">
                  <button disabled={reviewSubmitting} onClick={async () => {
                    setReviewSubmitting(true);
                    setReviewError(null);
                    try {
                      const pid = reviewBooking.property?.property_id;
                      if (!pid) throw new Error('Property not available');
                      const payload = { rating: reviewRating, review_text: reviewText };
                      // create review
                      const created: any = await apiFetch(`/properties/${pid}/reviews`, { method: 'POST', body: JSON.stringify(payload) });

                      // refresh reviews for this property to pick up reviewer_name and date
                      const allRevs: any[] = await apiFetch(`/properties/${pid}/reviews`).catch(() => []);
                      const reviewerName = (user as any)?.fullName || '';
                      const mine = (allRevs || []).find(r => (r.reviewer_name || '') === reviewerName) || created;

                      const reviewEntry = {
                        bookingId: reviewBooking.booking_id,
                        city: reviewBooking.property?.city,
                        rating: mine?.rating || reviewRating,
                        reviewText: mine?.review_text || reviewText,
                        reviewDate: mine?.review_date ? String(mine.review_date).split('T')[0] : (new Date()).toISOString().split('T')[0]
                      };

                      // prepend to local reviews list
                      setMyReviews((prev) => [reviewEntry, ...prev]);

                      // mark booking as reviewed in bookingHistory
                      setBookingHistory((prev) => prev.map(b => b.booking_id === reviewBooking.booking_id ? { ...b, has_review: true } : b));

                      setShowReviewModal(false);
                      setReviewBooking(null);
                    } catch (err: any) {
                      setReviewError(err?.body || err?.message || 'Failed to submit review');
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }} className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
                  <button disabled={reviewSubmitting} onClick={() => { setShowReviewModal(false); setReviewBooking(null); }} className="px-4 py-2 border rounded">Cancel</button>
                  {reviewError && <div className="text-sm text-red-600">{reviewError}</div>}
                </div>
              </div>
            </div>
          )}

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
                              <button onClick={() => { setReviewBooking(booking); setReviewRating(5); setReviewText(''); setReviewError(null); setShowReviewModal(true); }} className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal border border-dashed border-charcoal/20 px-4 py-3 rounded-xl hover:border-charcoal/40 hover:bg-white transition-all flex items-center gap-2">
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
