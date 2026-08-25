import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg animate-fade-in flex flex-col items-center">
        <svg className="w-12 h-12 text-primary mb-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L13.4 8.6L20 10L13.4 11.4L12 18L10.6 11.4L4 10L10.6 8.6L12 2Z" />
        </svg>
        <h1 className="text-5xl font-serif font-medium text-foreground tracking-tight">
          PGGY
        </h1>
        <p className="text-muted-foreground mt-4 text-base md:text-lg leading-relaxed max-w-md mx-auto">
          The elegant way to manage your PG tenants, collect rent, and automate WhatsApp reminders.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center bg-white rounded-full p-2 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <Link
            href="/login"
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-full text-foreground text-sm font-medium hover:bg-muted transition-colors mr-2"
          >
            Login to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
