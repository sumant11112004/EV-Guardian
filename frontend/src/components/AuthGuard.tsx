'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Wraps protected pages. Waits for Zustand to hydrate from localStorage
 * before checking auth, preventing premature redirects to /auth/login.
 */
export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, user, _hasHydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect until store has rehydrated from localStorage
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (requireAdmin && !['admin', 'superadmin', 'manager', 'mechanic'].includes(user?.role || '')) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, user, requireAdmin]);

  // Show loading spinner until hydrated
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after hydration, show nothing (redirect in progress)
  if (!isAuthenticated) return null;
  if (requireAdmin && !['admin', 'superadmin', 'manager', 'mechanic'].includes(user?.role || '')) return null;

  return <>{children}</>;
}
