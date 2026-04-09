/* --- File: src/pages/AdminDashboard.tsx --- */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, Home, Clock, CheckCircle, XCircle, 
  Search, Filter, ChevronRight, Eye 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users'|'properties'|'all'|'owners'|'bookings'>('users');
  const [pendingOwners, setPendingOwners] = useState<any[]>([]);
  const [pendingProperties, setPendingProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [allOwners, setAllOwners] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000');
    const auth = localStorage.getItem('sms_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sms_token')}` } : {};
    (async () => {
      try {
        const [uOwners, uProps, props, owners, bks] = await Promise.all([
          fetch(API + '/admin/owners/unverified', { headers: { 'Content-Type': 'application/json', ...auth } }).then(r => r.json()).catch(() => []),
          fetch(API + '/admin/properties/unverified', { headers: { 'Content-Type': 'application/json', ...auth } }).then(r => r.json()).catch(() => []),
          fetch(API + '/admin/properties', { headers: { 'Content-Type': 'application/json', ...auth } }).then(r => r.json()).catch(() => []),
          fetch(API + '/admin/owners', { headers: { 'Content-Type': 'application/json', ...auth } }).then(r => r.json()).catch(() => []),
          fetch(API + '/admin/bookings', { headers: { 'Content-Type': 'application/json', ...auth } }).then(r => r.json()).catch(() => []),
        ]);
        setPendingOwners(uOwners || []);
        setPendingProperties(uProps || []);
        setAllProperties(props || []);
        setAllOwners(owners || []);
        setBookings(bks || []);
        // Debug: log fetched admin lists to inspect verification_status values
        console.debug('AdminDashboard fetched pendingOwners:', JSON.parse(JSON.stringify(uOwners || [])));
        console.debug('AdminDashboard fetched allOwners:', JSON.parse(JSON.stringify(owners || [])));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  async function fetchAllOwners() {
    try {
      return await (await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/admin/owners', { headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }})).json();
    } catch (e) { return []; }
  }

  async function fetchBookings() {
    try {
      return await (await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/admin/bookings', { headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }})).json();
    } catch (e) { return []; }
  }

  async function handleDeleteProperty(property_id: number) {
    setActionLoading(property_id);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/admin/properties/${property_id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }});
      setAllProperties(prev => prev.filter(p => p.property_id !== property_id));
      setPendingProperties(prev => prev.filter(p => p.property_id !== property_id));
    } catch (e) {
      alert('Failed to delete property');
    } finally { setActionLoading(null); }
  }

  async function handleDeleteOwner(owner_id: number) {
    setActionLoading(owner_id);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/admin/owners/${owner_id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }});
      setAllOwners(prev => prev.filter(o => o.owner_id !== owner_id));
      setPendingOwners(prev => prev.filter(o => o.owner_id !== owner_id));
    } catch (e) {
      alert('Failed to delete owner');
    } finally { setActionLoading(null); }
  }

  async function handleApproveOwner(owner: any) {
    setActionLoading(owner.owner_id);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/admin/owners/${owner.owner_id}/verify?status=Verified`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }});
      setPendingOwners(prev => prev.filter(o => o.owner_id !== owner.owner_id));
    } catch (e) {
      alert('Failed to approve owner');
    } finally { setActionLoading(null); }
  }

  async function handleRejectOwner(owner: any) {
    setActionLoading(owner.owner_id);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/admin/owners/${owner.owner_id}/verify?status=Rejected`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }});
      setPendingOwners(prev => prev.filter(o => o.owner_id !== owner.owner_id));
    } catch (e) {
      alert('Failed to reject owner');
    } finally { setActionLoading(null); }
  }

  async function handleApproveProperty(p: any) {
    setActionLoading(p.property_id);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/admin/properties/${p.property_id}/verify?status=Verified`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }});
      setPendingProperties(prev => prev.filter(x => x.property_id !== p.property_id));
    } catch (e) {
      alert('Failed to approve property');
    } finally { setActionLoading(null); }
  }

  async function handleRejectProperty(p: any) {
    setActionLoading(p.property_id);
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + `/admin/properties/${p.property_id}/verify?status=Rejected`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('sms_token') ? `Bearer ${localStorage.getItem('sms_token')}` : '' }});
      setPendingProperties(prev => prev.filter(x => x.property_id !== p.property_id));
    } catch (e) {
      alert('Failed to reject property');
    } finally { setActionLoading(null); }
  }

  return (
    <div className="min-h-screen bg-bone pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-5xl text-charcoal">Admin Portal</h1>
              <div className="bg-gold/10 text-gold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border border-gold/20">
                System Oversight
              </div>
            </div>
            <p className="font-sans text-charcoal/40 text-sm uppercase tracking-widest">
              StayMadeSimple Control Center • {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-charcoal/5 flex items-center gap-4">
                <div className="bg-blue-50 p-2 rounded-xl"><Users className="w-5 h-5 text-blue-600"/></div>
                <div>
                  <p className="text-[10px] uppercase text-charcoal/40 font-bold">Total Pending</p>
                  <p className="text-xl font-serif text-charcoal">{(pendingOwners?.length || 0) + (pendingProperties?.length || 0)}</p>
                </div>
              </div>
          </div>
        </motion.div>

        {/* Tab Selection */}
        <div className="flex gap-8 border-b border-charcoal/10 mb-8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'users' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            Owner Verification
            {activeTab === 'users' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
          <button 
            onClick={() => setActiveTab('properties')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'properties' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            Property Approvals
            {activeTab === 'properties' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'all' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            All Properties
            {activeTab === 'all' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
          <button 
            onClick={() => setActiveTab('owners')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'owners' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            Owners
            {activeTab === 'owners' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === 'bookings' ? 'text-charcoal' : 'text-charcoal/30'}`}
          >
            Bookings
            {activeTab === 'bookings' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
          </button>
        </div>

        {/* Dynamic Content Table */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2rem] border border-charcoal/5 overflow-hidden shadow-sm"
        >
          <table className="w-full text-left">
            <thead className="bg-charcoal/[0.02] border-b border-charcoal/5">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Details</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Submission Date</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-charcoal/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              <AnimatePresence mode='popLayout'>
                {activeTab === 'all' ? (
                  (allProperties || []).map((item: any) => (
                    <motion.tr key={`allprop-${item.property_id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="group hover:bg-bone/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-bone flex items-center justify-center font-serif text-charcoal border border-charcoal/10">{item.property_description ? item.property_description[0] : <Home className="w-4 h-4"/>}</div>
                          <div>
                            <p className="font-serif text-lg text-charcoal leading-none mb-1">{item.property_description ?? `#${item.property_id}`}</p>
                            <p className="text-xs text-charcoal/40">Owner: {item.owner_name ?? `#${item.owner_id}`}</p>
                            <p className="text-xs text-charcoal/40">Property ID: {item.property_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6"><div className="text-sm text-charcoal/60">{item.verification_status ?? '—'}</div></td>
                      <td className="px-8 py-6 text-sm text-charcoal/60">{item.city ?? '—'}</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/property/${item.property_id}`)} className="p-2 rounded-lg hover:bg-charcoal hover:text-white border border-charcoal/5 transition-all" title="View Property"><Eye className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteProperty(item.property_id)} disabled={actionLoading === item.property_id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Delete Property">Delete</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : activeTab === 'owners' ? (
                  (allOwners || []).map((item: any) => (
                    <motion.tr key={`owner-${item.owner_id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="group hover:bg-bone/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-bone flex items-center justify-center font-serif text-charcoal border border-charcoal/10">{item.name ? item.name[0] : '#'}</div>
                          <div>
                            <p className="font-serif text-lg text-charcoal leading-none mb-1">{item.name ?? `#${item.owner_id}`}</p>
                            <p className="text-xs text-charcoal/40">{item.email ?? '—'}</p>
                            <p className="text-xs text-charcoal/40">Owner ID: {item.owner_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6"><div className="text-sm text-charcoal/60">{item.verification_status ?? '—'}</div></td>
                      <td className="px-8 py-6 text-sm text-charcoal/60">—</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleDeleteOwner(item.owner_id)} disabled={actionLoading === item.owner_id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Delete Owner">Delete</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : activeTab === 'bookings' ? (
                  <>
                    {(bookings || []).filter((b: any) => b.booking_status !== 'Completed').map((b: any) => (
                      <motion.tr key={`booking-active-${b.booking_id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="group hover:bg-bone/30 transition-colors">
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-serif text-lg text-charcoal leading-none mb-1">Booking #{b.booking_id}</p>
                            <p className="text-xs text-charcoal/40">Property ID: {b.property_id}</p>
                            <p className="text-xs text-charcoal/40">Room ID: {b.room_id} • Customer: {b.customer_id}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">{b.booking_status ?? '—'}</td>
                        <td className="px-8 py-6 text-sm text-charcoal/60">{b.start_date ?? '—'} → {b.end_date ?? '—'}</td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => navigate(`/property/${b.property_id}`)} className="p-2 rounded-lg hover:bg-charcoal hover:text-white border border-charcoal/5 transition-all" title="View Property"><Eye className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}

                    {(bookings || []).some((b: any) => b.booking_status === 'Completed') && (
                      <motion.tr className="bg-charcoal/[0.03]"><td colSpan={4} className="px-8 py-3 text-sm text-charcoal/60">Completed Bookings</td></motion.tr>
                    )}

                    {(bookings || []).filter((b: any) => b.booking_status === 'Completed').map((b: any) => (
                      <motion.tr key={`booking-completed-${b.booking_id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="group hover:bg-bone/30 transition-colors">
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-serif text-lg text-charcoal leading-none mb-1">Booking #{b.booking_id}</p>
                            <p className="text-xs text-charcoal/40">Property ID: {b.property_id}</p>
                            <p className="text-xs text-charcoal/40">Room ID: {b.room_id} • Customer: {b.customer_id}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">{b.booking_status ?? 'Completed'}</td>
                        <td className="px-8 py-6 text-sm text-charcoal/60">{b.start_date ?? '—'} → {b.end_date ?? '—'}</td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => navigate(`/property/${b.property_id}`)} className="p-2 rounded-lg hover:bg-charcoal hover:text-white border border-charcoal/5 transition-all" title="View Property"><Eye className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </>
                ) : (
                  (activeTab === 'users' ? (pendingOwners || []) : (pendingProperties || [])).map((item: any) => (
                    <motion.tr key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="group hover:bg-bone/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-bone flex items-center justify-center font-serif text-charcoal border border-charcoal/10">{ 'name' in item ? item.name[0] : ('owner_name' in item && item.owner_name ? item.owner_name[0] : <Home className="w-4 h-4"/>) }</div>
                          <div>
                            <p className="font-serif text-lg text-charcoal leading-none mb-1">{'name' in item ? item.name : (item.property_description || item.title || `#${item.owner_id || item.property_id}`)}</p>
                            <p className="text-xs text-charcoal/40">{'email' in item ? item.email : (item.city || item.location || '')}</p>
                            {activeTab === 'users' ? <p className="text-xs text-charcoal/40">Owner ID: {item.owner_id ?? '—'}</p> : <><p className="text-xs text-charcoal/40">Owner: {item.owner_name ?? (`#${item.owner_id ?? '—'}`)}</p><p className="text-xs text-charcoal/40">Property ID: {item.property_id ?? '—'}</p></>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6"><div className="flex items-center gap-2 text-gold"><Clock className="w-3 h-3" /><span className="text-[10px] uppercase tracking-widest font-bold">Pending</span></div></td>
                      <td className="px-8 py-6 text-sm text-charcoal/60">{'date' in item ? item.date : (item.verification_submitted_at ? String(item.verification_submitted_at).split('T')[0] : '—')}</td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          {activeTab === 'properties' && <button onClick={() => navigate(`/property/${item.property_id}`)} className="p-2 rounded-lg hover:bg-charcoal hover:text-white border border-charcoal/5 transition-all" title="View Property"><Eye className="w-4 h-4" /></button>}
                          {activeTab === 'users' ? (<><button onClick={() => handleApproveOwner(item)} disabled={actionLoading === item.owner_id} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all" title="Approve"><CheckCircle className="w-4 h-4" /></button><button onClick={() => handleRejectOwner(item)} disabled={actionLoading === item.owner_id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Reject"><XCircle className="w-4 h-4" /></button></>) : (<><button onClick={() => handleApproveProperty(item)} disabled={actionLoading === item.property_id} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all" title="Approve"><CheckCircle className="w-4 h-4" /></button><button onClick={() => handleRejectProperty(item)} disabled={actionLoading === item.property_id} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all" title="Reject"><XCircle className="w-4 h-4" /></button></>)}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>

          
          
          {/* Empty State */}
              {(
                (activeTab === 'users' && (pendingOwners || []).length === 0) ||
                (activeTab === 'properties' && (pendingProperties || []).length === 0) ||
                (activeTab === 'all' && (allProperties || []).length === 0) ||
                (activeTab === 'owners' && (allOwners || []).length === 0) ||
                (activeTab === 'bookings' && (bookings || []).length === 0)
              ) && (
            <div className="py-20 text-center">
              <ShieldCheck className="w-12 h-12 text-charcoal/10 mx-auto mb-4" />
              <p className="font-serif text-xl text-charcoal/40">All clearances complete.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}