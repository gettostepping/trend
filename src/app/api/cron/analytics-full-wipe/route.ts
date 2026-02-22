import { NextRequest, NextResponse } from 'next/server';
import { fullWipeAnalyticsData } from '@/lib/analyticsAggregation';

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Full wipe of data older than 365 days
        const result = await fullWipeAnalyticsData(365);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to perform full wipe' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Full analytics data wipe completed',
            deleted: result.deleted
        });
    } catch (error) {
        console.error('Error in analytics full wipe cron:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
