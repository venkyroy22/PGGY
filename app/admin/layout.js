'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const AdminContext = createContext(null);

export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error);
          return;
        }
        if (data.owner && data.owner.role === 'ADMIN') {
          setAdmin(data.owner);
        } else {
          router.push('/dashboard'); // Not admin, go to normal dashboard
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    {
      name: 'Admin Dashboard',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      name: 'Owners',
      href: '/admin/owners',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      name: 'Properties',
      href: '/admin/properties',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl max-w-md w-full border border-destructive/20 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Access Error</h2>
          <p className="text-sm opacity-90">{errorMsg}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-6 px-6 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <AdminContext.Provider value={{ admin }}>
      <div className="min-h-screen w-full bg-background flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-background z-10 border-r border-border/40 transition-all duration-300 ${isCollapsed ? 'md:w-20' : 'md:w-60'}`}>
          {/* Logo */}
          <div className={`px-5 py-6 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
            <Link href="/admin" className={`items-center gap-2 text-primary hover:opacity-80 transition-opacity ${isCollapsed ? 'hidden' : 'inline-flex'}`}>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.4 8.6L20 10L13.4 11.4L12 18L10.6 11.4L4 10L10.6 8.6L12 2Z" />
              </svg>
              <span className="text-base font-serif font-semibold text-foreground tracking-tight">PGGY ADMIN</span>
            </Link>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 px-3 space-y-6 overflow-y-auto mt-4">
            <div>
              {!isCollapsed && <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Controls</p>}
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-muted/80 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="w-4 h-4 opacity-70 flex items-center justify-center shrink-0">{item.icon}</div>
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* User section */}
          <div className="p-3 mb-2">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group ${isCollapsed ? 'justify-center px-0' : 'px-3 justify-between text-left'}`}
              title={isCollapsed ? "Sign out" : undefined}
            >
              <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                  {admin?.name?.charAt(0)?.toUpperCase()}
                </div>
                {!isCollapsed && (
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    Sign Out
                  </p>
                )}
              </div>
              {!isCollapsed && (
                <svg className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/admin" className="inline-flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">PG</span>
              </div>
              <span className="text-sm font-semibold text-foreground">PGGY ADMIN</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-border animate-slide-in">
              <div className="px-4 py-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {admin?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{admin?.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors text-left"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-60'}`}>
          <div className="pt-14 md:pt-0">
            {children}
          </div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
