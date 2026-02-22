import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData } from '@/app/actions/analytics';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    try {
        const data = await getAnalyticsData(days);
        // Serialize dates properly
        const serialized = {
            ...data,
            clickEvents: data.clickEvents.map(ce => ({
                ...ce,
                createdAt: ce.createdAt.toISOString(),
            })),
        };
        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
