'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, vacated, all
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    aadharNumber: '',
    propertyId: '',
    roomId: '',
    bedId: '',
    moveInDate: new Date().toISOString().split('T')[0],
    dueDay: '1',
    depositAmount: '0',
    billingType: 'MONTHLY',
    agreedRent: '',
    moveOutDate: '',
    address: '',
    gender: ''
  });

  useEffect(() => {
    fetchTenants();
    fetchProperties(); // For the dropdown in Add Tenant
  }, [filter]);

  const fetchTenants = async () => {
    try {
      const res = await fetch(`/api/tenants?status=${filter}`);
      const data = await res.json();
      if (res.ok) setTenants(data.tenants);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (res.ok) setProperties(data.properties);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTenants([data.tenant, ...tenants]);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', phone: '', aadharNumber: '', propertyId: '', roomId: '', bedId: '', 
      moveInDate: new Date().toISOString().split('T')[0], dueDay: '1', depositAmount: '0',
      billingType: 'MONTHLY', agreedRent: '', moveOutDate: '', address: '', gender: ''
    });
  };

  // Selection helpers for dropdowns
  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const availableRooms = selectedProperty ? selectedProperty.rooms : [];
  const selectedRoom = availableRooms.find(r => r.id === formData.roomId);
  const availableBeds = selectedRoom ? selectedRoom.beds.filter(b => !b.tenant || b.tenant.status !== 'active') : [];

  const handleBedSelect = (e) => {
    const bedId = e.target.value;
    const bed = availableBeds.find(b => b.id === bedId);
    let rent = '';
    if (bed) {
      rent = formData.billingType === 'MONTHLY' ? bed.monthlyRent : (bed.dailyRent || '');
    }
    setFormData({...formData, bedId, agreedRent: rent.toString()});
  };

  const handleBillingTypeChange = (e) => {
    const type = e.target.value;
    const bed = availableBeds.find(b => b.id === formData.bedId);
    let rent = formData.agreedRent;
    if (bed) {
      rent = type === 'MONTHLY' ? bed.monthlyRent : (bed.dailyRent || '');
    }
    setFormData({...formData, billingType: type, agreedRent: rent.toString(), dueDay: type === 'MONTHLY' ? '1' : ''});
  };

  const filteredTenants = tenants.filter(t => {
    const matchName = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPhone = t.phone.includes(searchQuery);
    return matchName || matchPhone;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your tenants across all properties
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Tenant
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6 border-b border-border pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {['active', 'vacated', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                filter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
              }`}
            >
              {f} Tenants
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse-soft space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl"></div>)}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-muted/50">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No tenants found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {filter === 'active' ? "You don't have any active tenants yet." : "No tenants match this filter."}
          </p>
          {filter === 'active' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Tenant
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Tenant</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.billingType === 'DAILY' ? 'Daily Occupant' : `Due: ${tenant.dueDay} of month`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-foreground">+{tenant.phone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tenant.bed ? (
                        <div>
                          <p className="text-sm text-foreground">{tenant.bed.room.property.name}</p>
                          <p className="text-xs text-muted-foreground">Room {tenant.bed.room.roomNumber} • Bed {tenant.bed.bedNumber}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Vacated</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link 
                        href={`/dashboard/tenants/${tenant.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 animate-fade-in border border-border flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
              <h3 className="text-lg font-semibold text-foreground">Add New Tenant</h3>
              <button 
                onClick={() => !saving && setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Full Name *</label>
                    <input
                      type="text" required
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number *</label>
                    <input
                      type="tel" required
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Aadhar Number</label>
                    <input
                      type="text"
                      value={formData.aadharNumber} onChange={e => setFormData({...formData, aadharNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                      placeholder="1234 5678 9012"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                    <select
                      value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Permanent Address</label>
                    <input
                      type="text"
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                      placeholder="City, State, PIN"
                    />
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Bed Assignment</h4>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Property *</label>
                    <select
                      required
                      value={formData.propertyId}
                      onChange={e => setFormData({...formData, propertyId: e.target.value, roomId: '', bedId: ''})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-white"
                    >
                      <option value="">Select Property</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Room *</label>
                      <select
                        required disabled={!formData.propertyId}
                        value={formData.roomId}
                        onChange={e => setFormData({...formData, roomId: e.target.value, bedId: ''})}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-white disabled:bg-muted"
                      >
                        <option value="">Select Room</option>
                        {availableRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Bed *</label>
                      <select
                        required disabled={!formData.roomId}
                        value={formData.bedId}
                        onChange={handleBedSelect}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-white disabled:bg-muted"
                      >
                        <option value="">Select Bed</option>
                        {availableBeds.map(b => (
                          <option key={b.id} value={b.id}>
                            Bed {b.bedNumber} (Mo: ₹{b.monthlyRent}{b.dailyRent ? `, Day: ₹${b.dailyRent}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Billing Type *</label>
                    <select
                      required
                      value={formData.billingType}
                      onChange={handleBillingTypeChange}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-white"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="DAILY">Daily</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Agreed Rent (₹) *</label>
                    <input
                      type="number" required min="1" step="any"
                      value={formData.agreedRent} onChange={e => setFormData({...formData, agreedRent: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                      placeholder={formData.billingType === 'MONTHLY' ? 'Monthly rent amount' : 'Daily wage/rent amount'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Move-in Date *</label>
                    <input
                      type="date" required
                      value={formData.moveInDate} onChange={e => setFormData({...formData, moveInDate: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                    />
                  </div>
                  
                  {formData.billingType === 'MONTHLY' ? (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Due Day *</label>
                      <input
                        type="number" required min="1" max="28"
                        value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: e.target.value})}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                        title="Day of month rent is due (1-28)"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Check-out Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.moveOutDate} onChange={e => setFormData({...formData, moveOutDate: e.target.value})}
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                        min={formData.moveInDate}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Deposit (₹)</label>
                    <input
                      type="number" min="0"
                      value={formData.depositAmount} onChange={e => setFormData({...formData, depositAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end shrink-0 pt-4 border-t border-border">
                <button
                  type="button" onClick={() => setShowModal(false)} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving || !formData.bedId}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Adding...' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
