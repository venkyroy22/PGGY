'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TenantDetailPage({ params }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [showVacate, setShowVacate] = useState(false);
  const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing, setProcessing] = useState(false);

  const [resolvedParams, setResolvedParams] = useState(null);
  const router = useRouter();

  useEffect(() => {
    Promise.resolve(params).then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.id) fetchTenant();
  }, [resolvedParams]);

  const fetchTenant = async () => {
    try {
      const res = await fetch(`/api/tenants/${resolvedParams.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTenant(data.tenant);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVacate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vacate', moveOutDate: vacateDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTenant(data.tenant);
      setShowVacate(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !resolvedParams) {
    return <div className="p-8 max-w-4xl mx-auto animate-pulse-soft">Loading...</div>;
  }

  if (error || !tenant) {
    return <div className="p-8 max-w-4xl mx-auto text-destructive">{error || 'Tenant not found'}</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm font-medium text-muted-foreground mb-6">
        <Link href="/dashboard/tenants" className="hover:text-foreground transition-colors">Tenants</Link>
        <svg className="w-4 h-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-foreground">{tenant.name}</span>
      </nav>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{tenant.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {tenant.status}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.273-3.974-6.869-6.87l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                +{tenant.phone}
              </p>
              {tenant.aadharNumber && (
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                  Aadhar: {tenant.aadharNumber}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {tenant.status === 'active' && (
          <button
            onClick={() => setShowVacate(true)}
            className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            Mark as Vacated
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Accommodation</h3>
            {tenant.bed ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Property</p>
                  <p className="font-medium text-foreground">{tenant.bed.room.property.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Room</p>
                    <p className="font-medium text-foreground">{tenant.bed.room.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Bed</p>
                    <p className="font-medium text-foreground">{tenant.bed.bedNumber}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Monthly Rent</p>
                  <p className="font-medium text-foreground">₹{tenant.bed.monthlyRent}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No longer assigned to a bed.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Lease Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Move-in Date</p>
                <p className="font-medium text-foreground">{new Date(tenant.moveInDate).toLocaleDateString()}</p>
              </div>
              {tenant.moveOutDate && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Move-out Date</p>
                  <p className="font-medium text-foreground">{new Date(tenant.moveOutDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Due Day</p>
                  <p className="font-medium text-foreground">{tenant.dueDay} of month</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Deposit</p>
                  <p className="font-medium text-foreground">₹{tenant.depositAmount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rent History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-border p-5 h-full">
            <h3 className="font-semibold text-foreground mb-4">Rent History</h3>
            {tenant.rentCycles?.length > 0 ? (
              <div className="space-y-3">
                {/* Will be populated in Phase 4/5 */}
                <p className="text-sm text-muted-foreground">Rent cycles will appear here once generated.</p>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">No rent cycles recorded yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Rent cycles are generated automatically or manually from the Rent tab.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vacate Modal */}
      {showVacate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !processing && setShowVacate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Vacate Tenant</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Marking a tenant as vacated will remove them from their bed, making it available for new tenants. This action cannot be undone.
            </p>
            <form onSubmit={handleVacate}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-1.5">Move-out Date</label>
                <input
                  type="date"
                  required
                  value={vacateDate}
                  onChange={e => setVacateDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button" onClick={() => setShowVacate(false)} disabled={processing}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90"
                >
                  {processing ? 'Processing...' : 'Confirm Vacate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
