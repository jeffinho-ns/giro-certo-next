'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAdmin?: boolean;
  requireModerator?: boolean;
  /** Exige usuário lojista (vinculado a uma loja via partnerId). */
  requireLojista?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAdmin,
  requireModerator,
  requireLojista,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  // Lojista = usuário comum vinculado a uma loja. Admin/moderador NÃO entram aqui.
  const isLojista = !!user?.partnerId;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Separação total de áreas: lojista não acessa /dashboard e vice-versa.
      if (requireLojista && !isLojista) {
        router.push('/dashboard');
        return;
      }

      // Verificar permissões
      if (requireAdmin && user?.role !== UserRole.ADMIN) {
        router.push(isLojista ? '/minha-loja/pedidos' : '/dashboard');
        return;
      }

      if (requireModerator && user?.role !== UserRole.MODERATOR && user?.role !== UserRole.ADMIN) {
        router.push(isLojista ? '/minha-loja/pedidos' : '/dashboard');
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, user, loading, requireAdmin, requireModerator, requireLojista, requiredRole, isLojista, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireLojista && !isLojista) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Esta área é exclusiva para lojistas.</p>
        </div>
      </div>
    );
  }

  // Verificar permissões
  if (requireAdmin && user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (requireModerator && user?.role !== UserRole.MODERATOR && user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
