'use client';

import { useState, useEffect } from 'react';

export default function AdminOwnersPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await fetch('/api/admin/owners');
      const data = await res.json();
      if (res.ok) setOwners(data.owners);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (ownerId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdating(ownerId);
    
    try {
      const res = await fetch('/api/admin/owners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, status: newStatus })
      });
      
      if (res.ok) {
        setOwners(owners.map(o => o.id === ownerId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Manage Owners</h1>
          <p className="text-sm text-slate-500 mt-1">Control access for PG owners</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse-soft space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium text-center">Properties</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {owners.map(owner => (
                <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{owner.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Joined {new Date(owner.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{owner.email}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{owner.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium text-sm">
                      {owner._count.properties}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      owner.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {owner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatus(owner.id, owner.status)}
                      disabled={updating === owner.id}
                      className={`text-sm font-medium transition-colors disabled:opacity-50 ${
                        owner.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {updating === owner.id ? 'Updating...' : (owner.status === 'ACTIVE' ? 'Deactivate' : 'Activate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {owners.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No owners found on the platform.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
