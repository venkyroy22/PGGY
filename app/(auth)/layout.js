export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="px-6 py-4">
        <a href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">PG</span>
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">
            PGGY
          </span>
        </a>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PGGY. Built for PG owners in India.
        </p>
      </footer>
    </div>
  );
}
