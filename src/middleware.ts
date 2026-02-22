import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip API, static files, and maintenance page
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname === '/maintenance') {
        return NextResponse.next();
    }

    // Admin routes - require session
    if (pathname.startsWith('/admin')) {
        const sessionCookie = request.cookies.get('admin_session');

        if (pathname === '/admin' || pathname === '/admin/setup') {
            if (sessionCookie) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }

        return NextResponse.next();
    }

    // Public routes - check maintenance
    const adminSession = request.cookies.get('admin_session')?.value;
    if (adminSession) {
        return NextResponse.next();
    }

    try {
        const url = new URL('/api/maintenance-status', request.url);
        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await res.json();
        if (data?.maintenance === true) {
            return NextResponse.rewrite(new URL('/maintenance', request.url));
        }
    } catch {
        /* allow access on error */
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/|_next/|favicon\\.ico).*)'],
};
