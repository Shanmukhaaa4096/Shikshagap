import Link from 'next/link';
import { NotFoundIllustration } from '@/components/illustrations/StateIllustrations';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-card dark:bg-muted text-foreground font-sans flex flex-col justify-between p-6 sm:p-12">
      <div className="max-w-xl mx-auto my-auto border-2 border-border p-8 bg-card dark:bg-card text-center sm:text-left">
        <div className="flex justify-center sm:justify-start mb-4">
          <NotFoundIllustration className="w-48 h-auto" />
        </div>
        <div className="text-sm font-mono uppercase text-primary font-bold mb-2">
          HTTP 404 : Resource Not Found
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">Page Not Located</h1>
        <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed mb-6">
          The requested document or diagnostic route does not exist or has been relocated behind authorized institutional access.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="border-2 border-primary bg-primary text-primary-foreground px-4 py-2 text-sm font-mono uppercase font-bold hover:bg-primary transition-colors"
          >
            Assess Test (Start Diagnostic)
          </Link>
          <Link
            href="/"
            className="border border-border bg-primary text-primary-foreground dark:bg-muted dark:text-foreground px-4 py-2 text-sm font-mono uppercase font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Return to Home
          </Link>
          <Link
            href="/login"
            className="border border-border px-4 py-2 text-sm font-mono uppercase hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            Teacher Login
          </Link>
        </div>
      </div>
      <footer className="text-center text-sm font-mono text-muted-foreground dark:text-muted-foreground">
        ShikshaGap Educational Intelligence
      </footer>
    </div>
  );
}
