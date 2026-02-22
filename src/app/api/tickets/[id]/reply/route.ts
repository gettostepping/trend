import { NextRequest, NextResponse } from 'next/server';
import { sendEmailViaGmail } from '@/lib/gmail';
import { findTicketByNumber, getTicketById, addEmailToTicket, updateTicketStatus } from '@/lib/tickets';
import { generateCustomerNotification } from '@/lib/emailTemplates';
import { checkSession } from '@/app/actions/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await checkSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const { message } = await request.json();
        
        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Get ticket
        const ticket = await getTicketById(id);
        if (!ticket) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            );
        }

        // Get admin's email - format: username@trendsignite.com
        const adminEmail = `${user.username}@trendsignite.com`;
        
        // Generate email content
        const { subject, body: emailBody } = generateCustomerNotification(
            ticket.customerName,
            ticket.ticketNumber,
            adminEmail,
            {
                subject: `Re: [Ticket ${ticket.ticketNumber}] Your inquiry to TrendsIgnite`,
                body: message,
            }
        );
        
        // Send email via Gmail API
        const emailResult = await sendEmailViaGmail(
            ticket.customerEmail,
            subject,
            emailBody,
            adminEmail
        );

        // Add email to ticket thread
        await addEmailToTicket(
            ticket.id,
            emailResult.id || '',
            null,
            adminEmail,
            ticket.customerEmail,
            subject,
            message,
            false // isFromCustomer = false (it's from team)
        );

        // Update ticket status and lastTeamReply
        // When team member replies, status should be 'open' (waiting for customer response)
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                status: 'open', // Changed from 'replied' to 'open' - team replied, waiting for customer
                lastTeamReply: new Date(),
            },
            include: {
                assignedToUser: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                emailThread: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        return NextResponse.json(updatedTicket);
    } catch (error: any) {
        console.error('Error sending reply:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send reply' },
            { status: 500 }
        );
    }
}
