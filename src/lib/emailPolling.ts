import { google } from 'googleapis';
import { oauth2Client } from './gmail';
import {
    findOpenTicketByEmail,
    updateTicketOnCustomerReply,
    addEmailToTicket,
    markEmailAsForwarded,
    findTicketByNumber,
} from './tickets';
import { generateTeamNotification } from './emailTemplates';
import { sendEmailViaGmail } from './gmail';

/**
 * Check Gmail inbox for new replies to tickets
 */
export async function checkForTicketReplies() {
    if (!process.env.GMAIL_REFRESH_TOKEN) {
        throw new Error('Gmail refresh token not configured');
    }

    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        // Get recent messages (last 50) - INBOX ONLY to avoid processing our own sent emails
        // (customer notifications, team reply logs, etc. would otherwise be picked up from Sent)
        const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 50,
            q: `in:inbox (is:unread OR after:${oneDayAgo})`, // Inbox only - prevents Support messages from appearing
        });

        const messages = response.data.messages || [];
        const processedTickets: string[] = [];

        for (const message of messages) {
            if (!message.id) continue;

            try {
                // Get full message details
                const messageData = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id,
                    format: 'full',
                });

                const msg = messageData.data;
                const headers = msg.payload?.headers || [];
                
                const from = headers.find(h => h.name === 'From')?.value || '';
                const to = headers.find(h => h.name === 'To')?.value || '';
                const subject = headers.find(h => h.name === 'Subject')?.value || '';
                const inReplyTo = headers.find(h => h.name === 'In-Reply-To')?.value || '';
                const references = headers.find(h => h.name === 'References')?.value || '';
                const threadId = msg.threadId || null;
                const messageId = headers.find(h => h.name === 'Message-ID')?.value || '';

                // Extract email address from "From" header
                // Try to extract from angle brackets first, then from the end of the string
                let fromEmail = '';
                const angleBracketMatch = from.match(/<(.+?)>/);
                if (angleBracketMatch) {
                    fromEmail = angleBracketMatch[1];
                } else {
                    // If no angle brackets, try to extract email from the end
                    const emailMatch = from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    if (emailMatch) {
                        fromEmail = emailMatch[1];
                    } else {
                        fromEmail = from.split(' ').pop() || '';
                    }
                }
                const cleanFromEmail = fromEmail.replace(/[<>]/g, '').toLowerCase().trim();
                
                console.log(`Processing email ${message.id}: from="${from}", extracted="${cleanFromEmail}", subject="${subject}"`);

                // Early check: Skip if this is clearly one of our own notification emails
                // This prevents notification emails from being processed as ticket replies
                const gmailUser = process.env.GMAIL_USER?.toLowerCase() || '';
                const subjectLower = subject.toLowerCase();
                const isFromOurAccount = cleanFromEmail === gmailUser || cleanFromEmail === 'support@trendsignite.com';
                
                // Extract "To" email addresses
                const toEmails = to.toLowerCase().split(',').map(e => {
                    const match = e.match(/<(.+?)>/) || e.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    return match ? match[1].toLowerCase().trim() : e.toLowerCase().trim();
                });
                
                // Check if this email is being sent TO team members (not to customers)
                // Team notification emails are sent to team members, not customers
                const teamEmails = process.env.TEAM_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
                const logEmail = process.env.TICKETS_LOG_EMAIL?.toLowerCase();
                const isSentToTeam = toEmails.some(email => 
                    teamEmails.includes(email) || 
                    email === logEmail ||
                    (email.includes('@trendsignite.com') && email !== gmailUser)
                );
                
                // Skip if it's from our account AND sent to team members (notification email)
                if (isFromOurAccount && isSentToTeam) {
                    console.log(`Skipping team notification email ${message.id} - sent to team members, not customer`);
                    continue;
                }
                
                // Check subject for notification patterns (before extracting body)
                if (isFromOurAccount && (
                    subjectLower.includes('[ticket') && (
                        subjectLower.includes('new reply from') ||
                        subjectLower.includes('new ticket') ||
                        subjectLower.includes('contact form submission') ||
                        subjectLower.includes('team reply')
                    )
                )) {
                    console.log(`Skipping notification email ${message.id} - detected from subject: ${subject}`);
                    continue;
                }

                // Check if this is a reply to one of our automated messages
                // Look for ticket number in subject (case insensitive)
                const ticketNumberMatch = subject.match(/TKT-\d{4}-[A-Z0-9]+/i);
                const isReply = inReplyTo || references || subject.toLowerCase().includes('re:') || subject.toLowerCase().includes('tkt-');

                // Skip if it's not a reply and doesn't have ticket number
                if (!isReply && !ticketNumberMatch) {
                    continue;
                }

                // Find matching ticket
                let ticket = null;
                if (ticketNumberMatch) {
                    // Found ticket number in subject - use it
                    ticket = await findTicketByNumber(ticketNumberMatch[0].toUpperCase());
                } else {
                    // No ticket number in subject - try to find by thread ID or check if it's a reply to our emails
                    // Check if this is a reply to any ticket thread
                    if (threadId) {
                        // Try to find ticket by thread ID
                        const prisma = (await import('./prisma')).default;
                        const existingEmail = await prisma.emailMessage.findFirst({
                            where: { threadId: threadId },
                            include: { ticket: true },
                        });
                        if (existingEmail && existingEmail.ticket) {
                            ticket = existingEmail.ticket;
                            console.log(`Found ticket ${ticket.ticketNumber} by thread ID ${threadId}`);
                        }
                    }
                    
                    // If still no ticket, try to find by customer email (for customer replies)
                    if (!ticket) {
                        ticket = await findOpenTicketByEmail(cleanFromEmail);
                        if (ticket) {
                            console.log(`Found ticket ${ticket.ticketNumber} by customer email ${cleanFromEmail}`);
                        }
                    }
                }

                if (!ticket) {
                    console.log(`No matching ticket found for email from ${cleanFromEmail}, subject: ${subject}`);
                    continue; // No matching ticket found
                }

                // Skip if this is the automated reply email (sent when ticket was created)
                if (ticket.automatedReplyMessageId && message.id === ticket.automatedReplyMessageId) {
                    console.log(`Skipping automated reply email ${message.id} for ticket ${ticket.ticketNumber}`);
                    continue;
                }

                // Extract email body - prefer plain text to avoid HTML quoting issues
                let body = '';
                let isHTML = false;
                if (msg.payload?.body?.data) {
                    body = Buffer.from(msg.payload.body.data, 'base64').toString();
                    isHTML = msg.payload.mimeType === 'text/html';
                } else if (msg.payload?.parts) {
                    // First try to get plain text
                    for (const part of msg.payload.parts) {
                        if (part.mimeType === 'text/plain' && part.body?.data) {
                            body = Buffer.from(part.body.data, 'base64').toString();
                            isHTML = false;
                            break;
                        }
                    }
                    // If no plain text, get HTML
                    if (!body) {
                        for (const part of msg.payload.parts) {
                            if (part.mimeType === 'text/html' && part.body?.data) {
                                body = Buffer.from(part.body.data, 'base64').toString();
                                isHTML = true;
                                break;
                            }
                        }
                    }
                }
                
                // Clean HTML if present - extract text content and remove quoted sections
                if (isHTML && body) {
                    // Remove style and script tags first
                    body = body
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                    
                    // Find the first blockquote or gmail_quote - everything after that is quoted
                    const blockquoteMatch = body.match(/<blockquote[^>]*>|<div[^>]*class="gmail_quote[^"]*"|<div[^>]*class="[^"]*gmail_quote[^"]*"/i);
                    if (blockquoteMatch && blockquoteMatch.index !== undefined) {
                        body = body.substring(0, blockquoteMatch.index);
                    }
                    
                    // Try to extract just the message content (not the template)
                    // Look for common email template patterns and extract only the actual message
                    const messagePatterns = [
                        /<div[^>]*class="[^"]*message-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                        /<div[^>]*class="[^"]*reply-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                        /<div[^>]*dir="ltr"[^>]*>([\s\S]*?)(?:<div[^>]*class="gmail_quote|<blockquote|$)/i,
                    ];
                    
                    let extractedMessage = '';
                    for (const pattern of messagePatterns) {
                        const match = body.match(pattern);
                        if (match && match[1]) {
                            extractedMessage = match[1];
                            break;
                        }
                    }
                    
                    // If we found a message, use it; otherwise clean the whole body
                    if (extractedMessage) {
                        body = extractedMessage;
                    }
                    
                    // Remove HTML tags and extract text
                    body = body
                        .replace(/<div[^>]*dir="ltr"[^>]*>/gi, '\n')
                        .replace(/<div[^>]*>/gi, '\n')
                        .replace(/<\/div>/gi, '')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<p[^>]*>/gi, '\n')
                        .replace(/<\/p>/gi, '')
                        .replace(/<span[^>]*>/gi, '')
                        .replace(/<\/span>/gi, '')
                        .replace(/<a[^>]*>/gi, '')
                        .replace(/<\/a>/gi, '')
                        .replace(/<strong[^>]*>/gi, '')
                        .replace(/<\/strong>/gi, '')
                        .replace(/<em[^>]*>/gi, '')
                        .replace(/<\/em>/gi, '')
                        .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/&#x27;/g, "'")
                        .replace(/&#x2F;/g, '/')
                        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive newlines
                        .trim();
                    
                    // Remove email template content and CSS-like patterns
                    const lines = body.split('\n');
                    const cleanedLines: string[] = [];
                    let skipTemplate = false;
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        
                        // Skip lines that look like CSS or HTML remnants
                        if (trimmed.includes('{') || trimmed.includes('}') || 
                            trimmed.match(/^[a-zA-Z-]+\s*:\s*[^;]+;?\s*$/) ||
                            trimmed.startsWith('.') || trimmed.startsWith('#') ||
                            trimmed.includes('margin:') || trimmed.includes('padding:') ||
                            trimmed.includes('font-size:') || trimmed.includes('color:') ||
                            trimmed.includes('background-color:') || trimmed.includes('border:')) {
                            continue;
                        }
                        
                        // Skip template headers/footers
                        if (trimmed.includes('TRENDSIGNITE') && 
                            (trimmed.includes('Influencer Marketing') || trimmed.includes('Management'))) {
                            skipTemplate = true;
                            continue;
                        }
                        if (trimmed.includes('Reply to this email') || 
                            trimmed.includes('Ticket #') ||
                            trimmed.includes('Ticket Information') ||
                            trimmed.includes('www.trendsignite.com') ||
                            trimmed.includes('Thank you for contacting')) {
                            skipTemplate = true;
                            continue;
                        }
                        if (skipTemplate && trimmed.length === 0) {
                            skipTemplate = false;
                            continue;
                        }
                        if (!skipTemplate) {
                            cleanedLines.push(line);
                        }
                    }
                    
                    body = cleanedLines.join('\n').trim();
                    
                    // Final cleanup - remove any remaining CSS-like patterns
                    body = body
                        .replace(/\{[^}]*\}/g, '')
                        .replace(/[a-zA-Z-]+\s*:\s*[^;]+;/g, '')
                        .trim();
                }
                
                // Clean up plain text - remove quoted sections
                if (!isHTML && body) {
                    const lines = body.split('\n');
                    const cleanedLines: string[] = [];
                    let inQuotedSection = false;
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Detect start of quoted section
                        if (trimmed.startsWith('>') || 
                            (trimmed.startsWith('On ') && trimmed.includes('wrote:')) ||
                            (trimmed.includes('From:') && trimmed.includes('trendsignite.com')) ||
                            trimmed.includes('Sent:') ||
                            (trimmed.includes('To:') && trimmed.includes('trendsignite.com')) ||
                            (trimmed.includes('TRENDSIGNITE') && trimmed.includes('Influencer Marketing'))) {
                            inQuotedSection = true;
                            continue;
                        }
                        // Stop at separator lines
                        if (inQuotedSection && (trimmed === '---' || trimmed.startsWith('Ticket ID:') || trimmed.includes('Reply to this email'))) {
                            break;
                        }
                        if (!inQuotedSection) {
                            cleanedLines.push(line);
                        }
                    }
                    body = cleanedLines.join('\n').trim();
                }

                // Determine if this is from customer or team (check BEFORE body extraction to avoid false positives)
                const isFromCustomer = cleanFromEmail === ticket.customerEmail.toLowerCase();
                
                // Check if this is one of our automated notification emails (skip these to prevent loops)
                // Check both subject and body - use case-insensitive matching
                // Note: gmailUser and subjectLower are already defined earlier in the function
                const rawBodyLower = body.toLowerCase();
                
                // Check subject line for notification patterns
                const isNotificationSubject = subjectLower.includes('[ticket') && 
                                             (subjectLower.includes('new reply from') ||
                                              subjectLower.includes('new ticket') ||
                                              subjectLower.includes('contact form submission') ||
                                              subjectLower.includes('team reply'));
                
                // Check body for notification patterns
                const isNotificationBody = (rawBodyLower.includes('trendsignite') || rawBodyLower.includes('<!doctype html>')) && 
                                         (rawBodyLower.includes('has replied to your ticket') ||
                                          rawBodyLower.includes('new customer reply') ||
                                          rawBodyLower.includes('new reply from') ||
                                          rawBodyLower.includes('new ticket created') ||
                                          rawBodyLower.includes('a new ticket has been created') ||
                                          rawBodyLower.includes('contact form submission') ||
                                          rawBodyLower.includes('ticket information') ||
                                          rawBodyLower.includes('team reply logged') ||
                                          rawBodyLower.includes('view in dashboard'));
                
                // Only skip if it's from our Gmail account AND has notification patterns
                const isOurNotification = (isNotificationSubject || isNotificationBody) &&
                                         (cleanFromEmail === gmailUser || cleanFromEmail === 'support@trendsignite.com');
                
                if (isOurNotification) {
                    console.log(`Skipping our own notification email ${message.id} to prevent loop (subject: ${subject})`);
                    continue;
                }
                
                // Check if we've already processed this message
                const { PrismaClient } = await import('@prisma/client');
                const prisma = (await import('./prisma')).default;
                const existingEmail = await prisma.emailMessage.findUnique({
                    where: { gmailMessageId: message.id },
                });

                if (existingEmail) {
                    console.log(`Email ${message.id} already processed, skipping`);
                    continue; // Already processed
                }
                
                // Only treat personal team emails as team replies (not support@trendsignite.com)
                // support@trendsignite.com / GMAIL_USER is the automated account - NEVER add to thread
                const isSupportAccount = cleanFromEmail === gmailUser || cleanFromEmail === 'support@trendsignite.com';
                const isPersonalTeamEmail = cleanFromEmail.includes('trendsignite.com') && !isSupportAccount;
                
                // Never add emails from our own support account to the ticket - they are system/outbound
                if (isSupportAccount) {
                    console.log(`Skipping support account email ${message.id} - never add to ticket thread`);
                    continue;
                }
                
                const isTeamReply = !isFromCustomer && !isOurNotification && isPersonalTeamEmail;

                console.log(`Found matching ticket ${ticket.ticketNumber} for email from ${cleanFromEmail} (${isFromCustomer ? 'customer' : isTeamReply ? 'team' : 'other'})`);
                console.log(`  - Customer email: ${ticket.customerEmail.toLowerCase()}`);
                console.log(`  - From email: ${cleanFromEmail}`);
                console.log(`  - Is customer: ${isFromCustomer}`);
                console.log(`  - Body preview: ${body.substring(0, 100)}`);

                // Add email to ticket thread (track both customer and team replies)
                // Store the cleaned email address, not the full "Name <email>" format
                const emailMessage = await addEmailToTicket(
                    ticket.id,
                    message.id,
                    threadId,
                    cleanFromEmail, // Store cleaned email instead of full "from" header
                    to,
                    subject,
                    body,
                    isFromCustomer
                );

                if (isFromCustomer) {
                    console.log(`Processing customer reply for ticket ${ticket.ticketNumber}`);
                    // Update ticket status and expiration
                    const newExpiresAt = new Date();
                    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
                    await updateTicketOnCustomerReply(ticket.id, newExpiresAt);

                    // Forward to team
                    console.log(`Forwarding customer reply to team...`);
                    await forwardReplyToTeam(ticket, {
                        subject,
                        body,
                        receivedAt: new Date(msg.internalDate ? parseInt(msg.internalDate) : Date.now()),
                    }, emailMessage.id);
                    console.log(`Successfully forwarded customer reply for ticket ${ticket.ticketNumber}`);
                } else if (isTeamReply) {
                    // Update ticket with team reply timestamp
                    // When team member replies, status should be 'open' (waiting for customer response)
                    await prisma.ticket.update({
                        where: { id: ticket.id },
                        data: { 
                            lastTeamReply: new Date(),
                            status: 'open', // Changed from 'replied' to 'open' - team replied, waiting for customer
                        },
                    });
                    console.log(`Tracked team reply from ${cleanFromEmail} for ticket ${ticket.ticketNumber}`);
                    
                    // Notify customer about team reply
                    try {
                        const { generateCustomerNotification } = await import('./emailTemplates');
                        const notification = generateCustomerNotification(
                            ticket.customerName,
                            ticket.ticketNumber,
                            cleanFromEmail,
                            {
                                subject,
                                body,
                            }
                        );
                        
                        const fromEmail = process.env.GMAIL_USER || 'support@trendsignite.com';
                        await sendEmailViaGmail(
                            ticket.customerEmail,
                            notification.subject,
                            notification.body,
                            fromEmail
                        );
                        console.log(`Notified customer ${ticket.customerEmail} about team reply from ${cleanFromEmail}`);
                    } catch (error) {
                        console.error(`Failed to notify customer about team reply:`, error);
                        // Don't fail the whole process if notification fails
                    }
                    
                    // Also send team reply to tickets-log email for record keeping
                    try {
                        const logEmail = process.env.TICKETS_LOG_EMAIL;
                        if (logEmail) {
                            const { generateTeamReplyLogNotification } = await import('./emailTemplates');
                            const logNotification = generateTeamReplyLogNotification(
                                ticket.ticketNumber,
                                ticket.customerName,
                                ticket.customerEmail,
                                cleanFromEmail,
                                {
                                    subject,
                                    body,
                                }
                            );
                            
                            const fromEmail = process.env.GMAIL_USER || 'support@trendsignite.com';
                            await sendEmailViaGmail(
                                logEmail,
                                logNotification.subject,
                                logNotification.body,
                                fromEmail
                            );
                            console.log(`Sent team reply to tickets-log ${logEmail}`);
                        }
                    } catch (error) {
                        console.error(`Failed to send team reply to tickets-log:`, error);
                        // Don't fail the whole process if log email fails
                    }
                }

                processedTickets.push(ticket.ticketNumber);

                // Mark message as read (skip if we don't have modify scope)
                try {
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: message.id,
                        requestBody: {
                            removeLabelIds: ['UNREAD'],
                        },
                    });
                } catch (error: any) {
                    // If we don't have modify scope, that's okay - just log it
                    if (error.message?.includes('insufficient authentication scopes')) {
                        console.log(`Skipping mark as read for ${message.id} - need gmail.modify scope`);
                    } else {
                        throw error;
                    }
                }

            } catch (error) {
                console.error(`Error processing message ${message.id}:`, error);
                continue;
            }
        }

        return {
            processed: processedTickets.length,
            tickets: processedTickets,
        };
    } catch (error) {
        console.error('Error checking for ticket replies:', error);
        throw error;
    }
}

/**
 * Forward customer reply to team members
 */
async function forwardReplyToTeam(
    ticket: any,
    customerReply: { subject: string; body: string; receivedAt: Date },
    emailMessageId: string
) {
    const teamEmails = process.env.TEAM_EMAILS?.split(',') || [];
    const logEmail = process.env.TICKETS_LOG_EMAIL;
    const fromEmail = process.env.GMAIL_USER || 'noreply@trendsignite.com';

    if (teamEmails.length === 0 && !logEmail) {
        console.warn('No team emails configured');
        return;
    }

    const notification = generateTeamNotification(ticket, customerReply);
    const allRecipients = [...teamEmails];
    if (logEmail) {
        allRecipients.push(logEmail);
    }

    const forwardedTo: string[] = [];

    console.log(`Forwarding customer reply for ticket ${ticket.ticketNumber} to: ${allRecipients.join(', ')}`);

    for (const recipient of allRecipients) {
        try {
            await sendEmailViaGmail(
                recipient.trim(),
                notification.subject,
                notification.body,
                fromEmail
            );
            forwardedTo.push(recipient.trim());
            console.log(`Successfully forwarded to ${recipient.trim()}`);
        } catch (error) {
            console.error(`Failed to forward to ${recipient}:`, error);
        }
    }

    // Mark email as forwarded
    if (forwardedTo.length > 0) {
        await markEmailAsForwarded(emailMessageId, forwardedTo);
        console.log(`Marked email ${emailMessageId} as forwarded to ${forwardedTo.length} recipients`);
    } else {
        console.warn(`No emails were successfully forwarded for ticket ${ticket.ticketNumber}`);
    }
}
