"use server";

import { sendEmailViaGmail } from "@/lib/gmail";
import { createTicket, updateTicketAutomatedReply } from "@/lib/tickets";
import { generateAutomatedReply } from "@/lib/emailTemplates";

export async function sendEmail(prevState: any, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
        return { success: false, message: "Please fill in all fields." };
    }

    try {
        const fromEmail = process.env.GMAIL_USER || "noreply@trendsignite.com";

        // Create ticket
        const ticket = await createTicket(name, email, message);

        // Send automated reply to customer
        const automatedReplyBody = generateAutomatedReply(name, ticket.ticketNumber);
        const automatedReplySubject = `Re: [Ticket ${ticket.ticketNumber}] Your inquiry to TrendsIgnite`;
        
        const replyResult = await sendEmailViaGmail(
            email,
            automatedReplySubject,
            automatedReplyBody,
            fromEmail
        );

        // Extract message ID from Gmail API response
        const automatedReplyMessageId = replyResult.id || undefined;

        // Update ticket with automated reply message ID
        if (automatedReplyMessageId) {
            await updateTicketAutomatedReply(ticket.id, automatedReplyMessageId);
        }

        // Notify team about new ticket
        try {
            const teamEmails = process.env.TEAM_EMAILS?.split(',') || [];
            const logEmail = process.env.TICKETS_LOG_EMAIL;
            const allRecipients = [...teamEmails];
            if (logEmail) {
                allRecipients.push(logEmail);
            }

            if (allRecipients.length > 0) {
                const { generateTeamNewTicketNotification } = await import('@/lib/emailTemplates');
                const notification = generateTeamNewTicketNotification(
                    ticket.ticketNumber,
                    name,
                    email,
                    message
                );

                for (const recipient of allRecipients) {
                    await sendEmailViaGmail(
                        recipient.trim(),
                        notification.subject,
                        notification.body,
                        fromEmail
                    );
                }
            }
        } catch (error) {
            console.error('Failed to notify team about new ticket:', error);
            // Don't fail the whole request if team notification fails
        }

        return { 
            success: true, 
            message: "Message sent successfully! Check your email for a confirmation with your ticket number." 
        };
    } catch (error: any) {
        console.error("Error sending email:", error);
        
        // Provide helpful error messages
        if (error.message?.includes("refresh token")) {
            return { 
                success: false, 
                message: "Email service not configured. Please complete Gmail API setup." 
            };
        }
        
        return { 
            success: false, 
            message: error.message || "Failed to send message. Please try again later." 
        };
    }
}
