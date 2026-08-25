'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PropertyDetailPage({ params }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Unwrap params using React.use() equivalent pattern for Next 15+ App router if needed,
  // but for Next 13/14, params is an object (or Promise in 15). We'll assume standard params for now.
  const [resolvedParams, setResolvedParams] = useState(null);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', bedCount: '2', monthlyRent: '', dailyRent: '' });
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');

  const [editBedModal, setEditBedModal] = useState(null); // holds bed object
  const [newRent, setNewRent] = useState('');
  const [newDailyRent, setNewDailyRent] = useState('');
  const [savingBed, setSavingBed] = useState(false);

  useEffect(() => {
    // Next 15 specific unwrapping of params (if it's a promise)
    Promise.resolve(params).then(p => {
      setResolvedParams(p);
    });
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.id) {
      fetchProperty();
    }
  }, [resolvedParams]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/properties/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProperty(data.property);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setRoomError('');
    setSavingRoom(true);
    try {
      const res = await fetch(`/api/properties/${resolvedParams.id}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local state
      setProperty({
        ...property,
        rooms: [...property.rooms, data.room].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
      });
      setShowRoomModal(false);
      setNewRoom({ roomNumber: '', bedCount: '2', monthlyRent: '', dailyRent: '' });
    } catch (err) {
      setRoomError(err.message);
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room and all its beds?')) return;
    
    try {
      const res = await fetch(`/api/properties/${resolvedParams.id}/rooms/${roomId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      setProperty({
        ...property,
        rooms: property.rooms.filter(r => r.id !== roomId)
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateBedRent = async (e) => {
    e.preventDefault();
    setSavingBed(true);
    try {
      const res = await fetch(`/api/beds/${editBedModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          monthlyRent: newRent, 
          dailyRent: newDailyRent || null 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local state
      setProperty({
        ...property,
        rooms: property.rooms.map(room => {
          if (room.id === editBedModal.roomId) {
            return {
              ...room,
              beds: room.beds.map(bed => bed.id === editBedModal.id ? { 
                ...bed, 
                monthlyRent: parseFloat(newRent),
                dailyRent: newDailyRent ? parseFloat(newDailyRent) : null
              } : bed)
            };
          }
          return room;
        })
      });
      setEditBedModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingBed(false);
    }
  };

  const openEditBed = (bed) => {
    setEditBedModal(bed);
    setNewRent(bed.monthlyRent.toString());
    setNewDailyRent(bed.dailyRent ? bed.dailyRent.toString() : '');
  };

  if (loading || !resolvedParams) {
    return (
      <div className="p-6 md:p-8 animate-pulse-soft max-w-7xl mx-auto">
        <div className="h-4 w-24 bg-muted rounded mb-6"></div>
        <div className="h-8 w-64 bg-muted rounded mb-2"></div>
        <div className="h-4 w-48 bg-muted rounded mb-12"></div>
        <div className="space-y-6">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {error || 'Property not found'}
        </div>
        <Link href="/dashboard/properties" className="text-primary mt-4 inline-block hover:underline">
          &larr; Back to Properties
        </Link>
      </div>
    );
  }

  // Calculate some stats
  const totalRooms = property.rooms.length;
  const totalBeds = property.rooms.reduce((sum, r) => sum + r.beds.length, 0);
  const occupiedBeds = property.rooms.reduce((sum, r) => sum + r.beds.filter(b => b.tenant?.status === 'active').length, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm font-medium text-muted-foreground mb-6">
        <Link href="/dashboard/properties" className="hover:text-foreground transition-colors">Properties</Link>
        <svg className="w-4 h-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-foreground">{property.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{property.name}</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {property.address ? `${property.address}${property.city ? `, ${property.city}` : ''}` : 'No address provided'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg bg-muted border border-border text-center">
            <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Occupancy</span>
            <span className="font-semibold text-foreground">{occupiedBeds} / {totalBeds}</span>
          </div>
          <button
            onClick={() => setShowRoomModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Room
          </button>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to delete this property? All rooms, beds, and tenant data inside this property will be permanently deleted.')) {
                try {
                  const res = await fetch(`/api/properties/${resolvedParams.id}`, { method: 'DELETE' });
                  if (!res.ok) throw new Error('Failed to delete property');
                  router.push('/dashboard/properties');
                } catch (err) {
                  alert(err.message);
                }
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-y-6">
        {property.rooms.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl bg-muted/30">
            <h3 className="text-lg font-medium text-foreground mb-1">No rooms added yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Start by adding rooms and configuring the number of beds and rent for each bed.
            </p>
            <button
              onClick={() => setShowRoomModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Add First Room
            </button>
          </div>
        ) : (
          property.rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Room {room.roomNumber}</h3>
                    <p className="text-xs text-muted-foreground">{room.beds.length} Beds</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete Room"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {room.beds.map((bed) => (
                    <div key={bed.id} className="border border-border rounded-lg p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-semibold text-sm">
                          {bed.bedNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bed.tenant?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {bed.tenant?.status === 'active' ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-border border-dashed">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Rent</p>
                            <p className="font-semibold text-foreground text-sm">
                              ₹{bed.monthlyRent}/mo
                              {bed.dailyRent && <span className="text-xs text-muted-foreground block">₹{bed.dailyRent}/day</span>}
                            </p>
                          </div>
                          <button
                            onClick={() => openEditBed(bed)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingRoom && setShowRoomModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-border">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Add New Room</h3>
              <button 
                onClick={() => !savingRoom && setShowRoomModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddRoom} className="p-6">
              {roomError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  {roomError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="roomNumber" className="block text-sm font-medium text-foreground mb-1.5">
                    Room Number/Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="roomNumber"
                    type="text"
                    required
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    placeholder="e.g. 101, A2, Ground-1"
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bedCount" className="block text-sm font-medium text-foreground mb-1.5">
                      Number of Beds <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="bedCount"
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={newRoom.bedCount}
                      onChange={(e) => setNewRoom({ ...newRoom, bedCount: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="monthlyRent" className="block text-sm font-medium text-foreground mb-1.5">
                      Monthly Rent (₹) <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="monthlyRent"
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={newRoom.monthlyRent}
                      onChange={(e) => setNewRoom({ ...newRoom, monthlyRent: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="dailyRent" className="block text-sm font-medium text-foreground mb-1.5">
                      Daily Rent (₹) <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      id="dailyRent"
                      type="number"
                      min="1"
                      step="any"
                      value={newRoom.dailyRent}
                      onChange={(e) => setNewRoom({ ...newRoom, dailyRent: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  disabled={savingRoom}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoom || !newRoom.roomNumber.trim() || !newRoom.monthlyRent}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingRoom && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bed Rent Modal */}
      {editBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingBed && setEditBedModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in border border-border">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Edit Bed {editBedModal.bedNumber}</h3>
              <button 
                onClick={() => !savingBed && setEditBedModal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateBedRent} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="editMonthlyRent" className="block text-sm font-medium text-foreground mb-1.5">
                    Monthly Rent (₹) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="editMonthlyRent"
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={newRent}
                    onChange={(e) => setNewRent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="editDailyRent" className="block text-sm font-medium text-foreground mb-1.5">
                    Daily Rent (₹) <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    id="editDailyRent"
                    type="number"
                    min="1"
                    step="any"
                    value={newDailyRent}
                    onChange={(e) => setNewDailyRent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-white text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditBedModal(null)}
                  disabled={savingBed}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBed || !newRent}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingBed ? 'Saving...' : 'Update Rent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
