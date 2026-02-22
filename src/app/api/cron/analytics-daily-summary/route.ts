import { NextRequest, NextResponse } from 'next/server';
import { createDailySummary } from '@/lib/analyticsAggregation';

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create summary for yesterday (since today might still be in progress)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const result = await createDailySummary(yesterday);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to create daily summary' },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: `Daily summary created for ${yesterday.toISOString().split('T')[0]}` 
        });
    } catch (error) {
        console.error('Error in daily summary cron:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
