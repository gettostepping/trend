import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldAnalyticsData } from '@/lib/analyticsAggregation';

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete raw data older than 180 days
        const result = await cleanupOldAnalyticsData(180);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to cleanup old data' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Old analytics data cleaned up',
            deleted: result.deleted
        });
    } catch (error) {
        console.error('Error in analytics cleanup cron:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
