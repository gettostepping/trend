import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/app/actions/analytics';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            path,
            referrer,
            userAgent,
            sessionId,
            screenResolution,
        } = body;

        if (!path || !sessionId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get Cloudflare headers if available
        const cloudflareCountry = request.headers.get('cf-ipcountry');
        const cloudflareConnectingIP = request.headers.get('cf-connecting-ip');
        
        // Get real IP (Cloudflare or forwarded or direct)
        const ip = cloudflareConnectingIP 
            || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || '';

        const result = await trackPageView({
            path,
            referrer,
            userAgent,
            ip,
            sessionId,
            screenResolution,
            cloudflareCountry: cloudflareCountry || undefined,
            cloudflareConnectingIP: cloudflareConnectingIP || undefined,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in track API route:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
