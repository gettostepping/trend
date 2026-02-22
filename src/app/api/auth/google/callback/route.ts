import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/gmail';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(
            new URL(`/admin/setup/gmail?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL('/admin/setup/gmail?error=no_code', request.url)
        );
    }

    try {
        const tokens = await getTokensFromCode(code);
        
        if (!tokens.refresh_token) {
            return NextResponse.redirect(
                new URL('/admin/setup/gmail?error=no_refresh_token', request.url)
            );
        }

        // Redirect to setup page with refresh token
        return NextResponse.redirect(
            new URL(
                `/admin/setup/gmail?refresh_token=${encodeURIComponent(tokens.refresh_token)}`,
                request.url
            )
        );
    } catch (error: any) {
        console.error('Error getting tokens:', error);
        return NextResponse.redirect(
            new URL(
                `/admin/setup/gmail?error=${encodeURIComponent(error.message || 'unknown_error')}`,
                request.url
            )
        );
    }
}
