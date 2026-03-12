import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';

export default function OwnerProperty() {
  const { id } = useParams();
  const [property, setProperty] = useState<any | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // add room form
  const [roomNumber, setRoomNumber] = useState('');
  const [rent, setRent] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // edit state per room
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) return;
        // fetch property details (public endpoint)
        try {
          const prop = await apiFetch(`/properties/${id}`);
          if (mounted) setProperty(prop);
        } catch (e) {
          // fallback: list owner properties and find
          try {
            const props: any[] = await apiFetch('/owner/properties').catch(() => []);
            const p = (props || []).find(x => String(x.property_id) === String(id));
            if (mounted) setProperty(p || null);
          } catch (_) {
            // ignore
          }
        }

        // fetch rooms for owner
        const rs: any[] = await apiFetch(`/owner/properties/${id}/rooms`).catch(() => []);
        if (mounted) setRooms(rs || []);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load property');
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  const refreshRooms = async () => {
    if (!id) return;
    const rs: any[] = await apiFetch(`/owner/properties/${id}/rooms`).catch(() => []);
    setRooms(rs || []);
  };

  const handleAddRoom = async (e: any) => {
    e?.preventDefault?.();
    if (!id) return;
    setSaving(true);
    try {
      const payload = { room_number: roomNumber || undefined, rent_per_month: rent === '' ? undefined : Number(rent), is_active: Boolean(isActive) };
      console.debug('OwnerProperty: adding room payload=', payload, 'to', `/owner/properties/${id}/rooms`);
      setStatusMsg('Sending request...');
      const res = await apiFetch(`/owner/properties/${id}/rooms`, { method: 'POST', body: JSON.stringify(payload) });
      console.debug('OwnerProperty: add response=', res);
      setStatusMsg('Room added successfully');
      setRoomNumber(''); setRent(''); setIsActive(true);
      await refreshRooms();
    } catch (err: any) {
      console.error('OwnerProperty: add room failed', err);
      setStatusMsg(`Add failed: ${err?.message || 'Unknown error'}`);
      alert(err?.message || 'Failed to add room');
    } finally { setSaving(false); }
  };

  const startEdit = (r: any) => {
    setEditingId(r.room_id);
    setEditData({ room_number: r.room_number, rent_per_month: r.rent_per_month, is_active: r.is_active });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (r: any) => {
    if (!id || !r) return;
    try {
      const payload = { room_number: editData.room_number || undefined, rent_per_month: editData.rent_per_month === '' ? undefined : Number(editData.rent_per_month), is_active: Boolean(editData.is_active) };
      await apiFetch(`/owner/properties/${id}/rooms/${r.room_id}`, { method: 'PUT', body: JSON.stringify(payload) });
      cancelEdit();
      await refreshRooms();
    } catch (err: any) {
      alert(err?.message || 'Failed to update room');
    }
  };

  if (loading) return <div className="p-12 text-center">Loading…</div>;
  if (error) return <div className="p-12 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-bone pt-32 pb-20 px-4 md:px-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
        <Link to="/my-properties" className="text-sm text-charcoal/60 underline">Back to My Properties</Link>
        <h1 className="font-serif text-2xl text-charcoal mt-4 mb-2">Manage Property</h1>
        <p className="text-sm text-charcoal/60 mb-6">{property?.property_description || 'Property'} — {property?.city || ''}</p>

        <section className="mb-8">
          <h3 className="font-bold mb-3">Rooms</h3>
          <div className="space-y-3">
            {rooms.length === 0 ? <div className="text-sm text-charcoal/60">No rooms yet.</div> : (
              rooms.map((r: any) => (
                <div key={r.room_id} className="flex items-center justify-between p-3 border rounded-md">
                  {editingId === r.room_id ? (
                    <div className="flex-1 flex gap-3 items-center">
                      <input className="px-3 py-2 border rounded" value={editData.room_number || ''} onChange={(e)=> setEditData(prev=>({...prev, room_number: e.target.value}))} />
                      <input className="px-3 py-2 border rounded w-28" type="number" value={editData.rent_per_month ?? ''} onChange={(e)=> setEditData(prev=>({...prev, rent_per_month: e.target.value}))} />
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editData.is_active)} onChange={(e)=> setEditData(prev=>({...prev, is_active: e.target.checked}))} /> Active</label>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{r.room_number}</div>
                      <div className="text-sm text-charcoal/60">₹{(r.rent_per_month ?? 0).toLocaleString()} • {r.is_active ? 'Active' : 'Inactive'} • {r.availability_text || ''}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {editingId === r.room_id ? (
                      <>
                        <button onClick={() => saveEdit(r)} className="px-3 py-1 rounded bg-charcoal text-white text-xs">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-1 rounded border text-xs">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r)} className="px-3 py-1 rounded border text-xs">Edit</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className="font-bold mb-3">Add Room</h3>
          <form onSubmit={handleAddRoom} className="flex gap-3 items-center">
            <input placeholder="Room number (optional)" value={roomNumber} onChange={(e)=> setRoomNumber(e.target.value)} className="px-3 py-2 border rounded w-48" />
            <input placeholder="Rent per month" type="number" value={rent as any} onChange={(e)=> setRent(e.target.value === '' ? '' : Number(e.target.value))} className="px-3 py-2 border rounded w-36" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> Active</label>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-charcoal text-white">{saving ? 'Adding…' : 'Add Room'}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
