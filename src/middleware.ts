import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir libre acceso a assets estáticos, login, imágenes y APIs públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Verificar existencia de la cookie de sesión del administrador
  const token = request.cookies.get('rifa_admin_token')?.value;

  // Si no está autenticado y accede a rutas del panel, redirigir al login
  if (!token && (pathname === '/' || pathname === '/clientes' || pathname === '/finanzas' || pathname === '/sorteos' || pathname === '/auditoria')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
