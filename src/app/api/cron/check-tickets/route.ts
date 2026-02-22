import { NextRequest, NextResponse } from 'next/server';
import { checkForTicketReplies } from '@/lib/emailPolling';
import { getExpiredTickets, closeTicket } from '@/lib/tickets';
import { sendEmailViaGmail } from '@/lib/gmail';

/**
 * Cron job endpoint to:
 * 1. Check for new ticket replies
 * 2. Auto-close expired tickets
 * 
 * Call this endpoint periodically (e.g., every 10 minutes)
 * You can use Vercel Cron, or a service like cron-job.org
 */
export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
        console.error('CRON_SECRET not configured');
        return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('Unauthorized cron request:', { 
            hasHeader: !!authHeader, 
            headerValue: authHeader?.substring(0, 20) + '...' 
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
        repliesChecked: { processed: 0, tickets: [] as string[] },
        ticketsClosed: [] as string[],
        errors: [] as string[],
    };

    try {
        // 1. Check for new replies
        try {
            console.log('Checking for ticket replies...');
            const replyResults = await checkForTicketReplies();
            results.repliesChecked = replyResults;
            console.log(`Processed ${replyResults.processed} ticket replies`);
        } catch (error: any) {
            console.error('Error checking for replies:', error);
            results.errors.push(`Reply check failed: ${error.message}`);
        }

        // 2. Auto-close expired tickets
        try {
            const expiredTickets = await getExpiredTickets();
            
            for (const ticket of expiredTickets) {
                await closeTicket(ticket.id);
                results.ticketsClosed.push(ticket.ticketNumber);

                // Optional: Send auto-close notification to customer
                if (process.env.SEND_AUTO_CLOSE_EMAIL === 'true') {
                    try {
                        const fromEmail = process.env.GMAIL_USER || 'noreply@trendsignite.com';
                        await sendEmailViaGmail(
                            ticket.customerEmail,
                            `[Ticket ${ticket.ticketNumber}] Closed - No Recent Activity`,
                            `Hello ${ticket.customerName},

Your ticket ${ticket.ticketNumber} has been automatically closed due to 7 days of inactivity.

If you still need assistance, please submit a new inquiry or reply to reopen this ticket.

Thank you,
TrendsIgnite Team`,
                            fromEmail
                        );
                    } catch (error) {
                        console.error(`Failed to send auto-close email for ${ticket.ticketNumber}:`, error);
                    }
                }
            }
        } catch (error: any) {
            results.errors.push(`Auto-close failed: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            ...results,
        }, { status: 500 });
    }
}
