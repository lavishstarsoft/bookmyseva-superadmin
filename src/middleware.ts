import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Skip if it's a static file or API request
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // files with extensions
    ) {
        return NextResponse.next();
    }
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    
    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    // Root path "/" - redirect to login or dashboard based on auth
    if (pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }
    
    // Public routes - if logged in and on login page, redirect to dashboard
    if (isPublicRoute) {
        if (token && pathname === '/login') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        // Allow access to public routes
        return addSecurityHeaders(NextResponse.next());
    }
    
    // Protected routes (everything else that's not public)
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }
    
    return addSecurityHeaders(NextResponse.next());
}

// Helper function to add security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next (Next.js internals)
         * - Static files with extensions
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
};
