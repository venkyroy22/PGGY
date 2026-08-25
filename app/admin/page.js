'use client';

import { useState, useEffect } from 'react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ totalOwners: 0, activeOwners: 0, pendingProperties: 0 });
  const [loading, setLoading] = useState(true);

  // Form state for creating owner
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/owners/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Successfully created owner: ${data.owner.name}`);
      setFormData({ name: '', email: '', phone: '', password: '' });
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Platform management and insights</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse-soft">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-2">Total Owners</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.totalOwners}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-2">Active Owners</p>
            <p className="text-3xl font-semibold text-emerald-600">{stats.activeOwners}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-2">Pending Properties</p>
            <p className="text-3xl font-semibold text-amber-600">{stats.pendingProperties}</p>
          </div>
        </div>
      )}

      {/* Create Owner Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-medium text-slate-900">Create New Owner</h2>
          <p className="text-sm text-slate-500 mt-1">Provision a new account for a paying client.</p>
        </div>
        
        <form onSubmit={handleCreateOwner} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email" required
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
              <input
                type="text" required
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                placeholder="Temporary password"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {success && <p className="text-sm text-emerald-600 font-medium mb-4">{success}</p>}

          <button
            type="submit" disabled={creating}
            className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Owner Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
