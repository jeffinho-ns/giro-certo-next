import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // O middleware do Next.js roda no servidor e não tem acesso ao localStorage
  // A proteção de rotas será feita pelo componente ProtectedRoute no cliente
  // Aqui apenas permitimos que todas as rotas sejam acessadas
  // A verificação real será feita no lado do cliente

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
