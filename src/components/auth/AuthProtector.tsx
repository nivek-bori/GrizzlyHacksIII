'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { privateRoutes } from '@/lib/util/config';
import Auth from './Auth';
import { cn, isAuthorized } from '@/types/types';
import LoadingComponent from '../ui/LoadingComponent';
import { useNotification } from '../notification/NotificationProvider';

interface AuthProtecterProps {
  children: React.ReactNode;
  className?: string;
}

interface AuthProtectorContextType {
  requireAuth: () => void;
}

const AuthContext = createContext<AuthProtectorContextType | undefined>(undefined);

export function useProtectorAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default function AuthProtecter({ children, className }: AuthProtecterProps) {
  const [stage, setStage] = useState<'loading' | 'auth_required' | 'success'>('loading');

  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { addNotification } = useNotification();

  useEffect(() => {
    if (profile.loading || !pathname) return;

    async function exec() {
      const userRole = profile.data?.role ?? 'GUEST';

      const requiredRole = Object.entries(privateRoutes).find(
        ([route]) => pathname.startsWith(route)
      )?.[1] || 'GUEST';

      if (requiredRole && !isAuthorized(userRole, requiredRole)) {
        if (profile.data) {
          addNotification({ message: 'You do not have access to that, please sign in', type: 'error' });
          router.push('/');
          return;
        }
        setStage('auth_required');
      } else {
        setStage('success');
      }
    }
    exec();
  }, [profile, pathname, router]);

  const value = useMemo(() => ({
      requireAuth: () => { setStage('auth_required'); }
    }), []);

  return <AuthContext.Provider value={value}>
    {stage === 'loading' && <LoadingComponent />}
    {stage === 'auth_required' && <Auth />}
    {stage === 'success' && <div className={cn('w-full h-full', className)}>{children}</div>}
  </AuthContext.Provider>;
}
