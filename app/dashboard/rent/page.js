'use client';

import { useState, useEffect } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = {
  paid: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  pending: 'bg-slate-100 text-slate-700',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function RentPage() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [note, setNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchCycles();
  }, [month, year, statusFilter]);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rent-cycles?month=${month}&year=${year}&status=${statusFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCycles(data.cycles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/rent-cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(`Generated successfully!\nCreated: ${data.stats.created}\nExisting: ${data.stats.existing}`);
      fetchCycles();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openPaymentModal = (cycle) => {
    setPaymentModal(cycle);
    setAmountPaid(cycle.amountPaid.toString());
    setNote(cycle.note || '');
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const res = await fetch(`/api/rent-cycles/${paymentModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local state
      setCycles(cycles.map(c => c.id === paymentModal.id ? data.cycle : c));
      setPaymentModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPayment(false);
    }
  };

  // Stats for the header
  const totalExpected = cycles.reduce((sum, c) => sum + c.amountDue, 0);
  const totalCollected = cycles.reduce((sum, c) => sum + c.amountPaid, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Rent Cycles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and collect monthly rent payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={month} 
            onChange={e => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-input rounded-lg text-sm bg-white"
          >
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select 
            value={year} 
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-input rounded-lg text-sm bg-white"
          >
            {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Bills'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expected Rent</p>
          <p className="text-2xl font-bold text-foreground">₹{totalExpected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Collected</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending/Overdue</p>
          <p className="text-2xl font-bold text-destructive">₹{(totalExpected - totalCollected).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Collection Rate</p>
          <p className="text-2xl font-bold text-primary">
            {totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        {['all', 'pending', 'partial', 'paid', 'overdue'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              statusFilter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="animate-pulse-soft space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-muted/50">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No bills for this month</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Generate the rent bills for {MONTHS[month-1]} {year} to start collecting payments.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Generate Bills Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Tenant & Property</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cycles.map(cycle => {
                  const propertyName = cycle.tenant?.bed?.room?.property?.name || 'Unknown Property';
                  const roomBed = cycle.tenant?.bed ? `Room ${cycle.tenant.bed.room.roomNumber} - Bed ${cycle.tenant.bed.bedNumber}` : '';
                  const isOverdue = new Date(cycle.dueDate) < new Date() && cycle.status !== 'paid';
                  // Calculate dynamic status for display if overdue
                  const displayStatus = isOverdue && cycle.status === 'pending' ? 'overdue' : cycle.status;

                  return (
                    <tr key={cycle.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{cycle.tenant?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{propertyName} • {roomBed}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-foreground'}`}>
                          {new Date(cycle.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">₹{cycle.amountDue}</span>
                          {cycle.amountPaid > 0 && (
                            <span className="text-emerald-600 text-xs ml-2">(₹{cycle.amountPaid} paid)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[displayStatus] || STATUS_COLORS.pending}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openPaymentModal(cycle)}
                          className="px-3 py-1.5 text-xs font-medium bg-white border border-border text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                          Update Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !savingPayment && setPaymentModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in border border-border">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Record Payment</h3>
              <button 
                onClick={() => !savingPayment && setPaymentModal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSavePayment} className="p-6">
              <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">Tenant</p>
                <p className="font-medium text-foreground">{paymentModal.tenant?.name}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">Amount Due</p>
                  <p className="font-semibold text-foreground">₹{paymentModal.amountDue}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Total Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={paymentModal.amountDue}
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => setAmountPaid(paymentModal.amountDue)} className="text-xs text-primary hover:underline font-medium">Mark Full Paid</button>
                    <button type="button" onClick={() => setAmountPaid('0')} className="text-xs text-muted-foreground hover:underline">Clear</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Paid via UPI"
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button" onClick={() => setPaymentModal(null)} disabled={savingPayment}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={savingPayment || amountPaid === ''}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                >
                  {savingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
