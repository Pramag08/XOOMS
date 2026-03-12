import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState<any | null>(null);
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // try owner bookings first
        const ownerBookings: any[] = await apiFetch('/owner/bookings').catch(() => []);
        let found = (ownerBookings || []).find(b => String(b.booking_id) === String(id));
        if (!found) {
          const customerBookings: any[] = await apiFetch('/customer/mybookings').catch(() => []);
          found = (customerBookings || []).find(b => String(b.booking_id) === String(id));
        }
        if (!mounted) return;
        if (!found) {
          setError('Booking not found');
          setBooking(null);
          setLoading(false);
          return;
        }
        setBooking(found);
        // try to fetch property details
        if (found.property_id) {
          try {
            const prop = await apiFetch(`/properties/${found.property_id}`);
            if (mounted) setProperty(prop);
          } catch (e) {
            // ignore
          }
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load booking');
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading booking…</div>;
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>;
  if (!booking) return <div className="p-12 text-center">No booking found.</div>;

  return (
    <div className="min-h-screen bg-bone pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <Link to="/my-properties" className="text-sm text-charcoal/60 underline">Back to My Properties</Link>
        <h1 className="font-serif text-2xl text-charcoal mt-4 mb-2">Booking {booking.booking_id}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-charcoal/60">Guest</p>
            <p className="font-bold text-charcoal">{booking.customer_name || booking.customer_id}</p>

            <p className="text-sm text-charcoal/60 mt-4">Status</p>
            <p className="font-bold text-charcoal">{booking.booking_status}</p>

            <p className="text-sm text-charcoal/60 mt-4">Dates</p>
            <p className="font-bold text-charcoal">{booking.start_date} → {booking.end_date}</p>
          </div>

          <div>
            <p className="text-sm text-charcoal/60">Property</p>
            {property ? (
              <div>
                <p className="font-bold text-charcoal">{property.property_description || property.room_description}</p>
                <p className="text-sm text-charcoal/60">{property.city}, {property.address}</p>
                <Link to={`/owner/properties/${property.property_id}`} className="text-sm text-charcoal/60 underline mt-2 inline-block">Manage Property</Link>
              </div>
            ) : (
              <div>
                <p className="font-bold text-charcoal">Property ID: {booking.property_id}</p>
                <Link to={`/owner/properties/${booking.property_id}`} className="text-sm text-charcoal/60 underline mt-2 inline-block">Manage Property</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
