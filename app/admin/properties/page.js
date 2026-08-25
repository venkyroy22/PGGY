'use client';

import { useState, useEffect } from 'react';

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (res.ok) setProperties(data.properties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (propertyId, status) => {
    setUpdating(propertyId);
    
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, status })
      });
      
      if (res.ok) {
        setProperties(properties.map(p => p.id === propertyId ? { ...p, status } : p));
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
          <h1 className="text-2xl font-semibold text-slate-900">Manage Properties</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve new property listings</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse-soft space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-medium">Property Details</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium text-center">Rooms / Tenants</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map(property => (
                <tr key={property.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{property.name}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{property.address}, {property.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{property.owner.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{property.owner.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{property._count.rooms}</span> rooms
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {property._count.tenants} tenants
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      property.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {property.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {property.status !== 'APPROVED' && (
                        <button
                          onClick={() => updateStatus(property.id, 'APPROVED')}
                          disabled={updating === property.id}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {property.status !== 'REJECTED' && (
                        <button
                          onClick={() => updateStatus(property.id, 'REJECTED')}
                          disabled={updating === property.id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {updating === property.id && <span className="text-xs text-slate-400">...</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {properties.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No properties found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
