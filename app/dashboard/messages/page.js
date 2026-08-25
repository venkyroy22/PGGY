'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const TYPE_LABELS = {
  upcoming: 'Upcoming Reminder (3 days)',
  due_today: 'Due Today Reminder',
  overdue: 'Overdue Reminder'
};

const STATUS_COLORS = {
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-destructive/10 text-destructive',
};

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages?limit=100');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTrigger = async () => {
    if (!confirm('This will trigger the cron job manually and send real WhatsApp messages to eligible tenants. Are you sure?')) return;
    
    try {
      const res = await fetch('/api/cron/send-reminders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-cron-secret'}` } // Mocking for dev, in prod use secure triggers
      });
      const data = await res.json();
      alert(`Triggered successfully.\nSent: ${data.stats?.upcoming + data.stats?.dueToday + data.stats?.overdue}\nFailed: ${data.stats?.failed}`);
      fetchMessages();
    } catch (err) {
      alert('Error triggering cron: ' + err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Message Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            History of automated WhatsApp rent reminders
          </p>
        </div>
        <button
          onClick={handleTestTrigger}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Run Reminder Cron Now
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse-soft space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl"></div>)}
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-muted/50">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No messages sent yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Automated rent reminders will appear here once the daily cron job starts running and finds eligible tenants.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Tenant</th>
                  <th className="px-6 py-4 font-medium">Message Type</th>
                  <th className="px-6 py-4 font-medium">Rent Cycle</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map(log => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground font-medium">
                        {new Date(log.sentAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{log.tenant?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">+{log.tenant?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">{TYPE_LABELS[log.messageType] || log.messageType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {log.rentCycle?.month}/{log.rentCycle?.year} (₹{log.rentCycle?.amountDue})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[log.status] || 'bg-slate-100 text-slate-700'}`}>
                          {log.status}
                        </span>
                        {log.errorMessage && (
                          <span className="text-xs text-destructive max-w-[200px] truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
