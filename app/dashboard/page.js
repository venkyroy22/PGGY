'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDashboard } from './layout';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { owner } = useDashboard();

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
      })
      .catch(err => console.error('Error fetching stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-12 max-w-4xl mx-auto -mt-10">
      
      {/* Central Greeting */}
      <div className="flex items-center gap-4 mb-10 animate-fade-in">
        <svg className="w-8 h-8 md:w-10 md:h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L13.4 8.6L20 10L13.4 11.4L12 18L10.6 11.4L4 10L10.6 8.6L12 2Z" />
        </svg>
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground tracking-tight">
          {getGreetingTime()}, {owner?.name?.split(' ')[0] || 'there'}
        </h1>
      </div>

      {/* The "Command Bar" (Action Container) */}
      <div className="w-full bg-white rounded-3xl md:rounded-[2rem] border border-border shadow-sm md:shadow-md p-3 md:p-4 mb-12 flex flex-col md:flex-row items-stretch gap-2 transition-all hover:shadow-lg">
        <div className="flex-1 px-4 py-2 flex items-center text-muted-foreground text-sm font-medium">
          What would you like to manage today?
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mt-2 md:mt-0">
          <Link href="/dashboard/properties" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 rounded-xl md:rounded-2xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground transition-colors group">
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Property
          </Link>
          <Link href="/dashboard/tenants" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 rounded-xl md:rounded-2xl bg-muted/50 hover:bg-muted text-sm font-medium text-foreground transition-colors group">
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
            </svg>
            Tenant
          </Link>
          <Link href="/dashboard/rent" className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 rounded-xl md:rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            Collect Rent
          </Link>
        </div>
      </div>

      {/* Subtle Stats Row */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 px-4 md:px-8">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Occupancy</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif text-foreground">{loading ? '—' : stats?.occupied ?? 0}</span>
            <span className="text-sm text-muted-foreground">/ {stats?.totalBeds || 0}</span>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Paid This Month</p>
          <span className="text-2xl font-serif text-foreground">₹{loading ? '—' : (stats?.paidThisMonth ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center md:items-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pending</p>
          <span className="text-2xl font-serif text-foreground">₹{loading ? '—' : (stats?.pending ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center md:items-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Overdue</p>
          <span className="text-2xl font-serif text-destructive">₹{loading ? '—' : (stats?.overdue ?? 0).toLocaleString()}</span>
        </div>
      </div>

    </div>
  );
}
