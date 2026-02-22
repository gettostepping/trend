/**
 * Base HTML email template wrapper
 */
function getEmailHTML(content: string, showFooter: boolean = true): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0;
        }
        .tagline {
            color: #b0b0b0;
            font-size: 12px;
            margin-top: 5px;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .ticket-badge {
            display: inline-block;
            background-color: #f0f0f0;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            color: #666;
            margin-bottom: 25px;
            font-weight: 500;
        }
        .message-content {
            color: #333;
            font-size: 15px;
            line-height: 1.8;
            margin: 25px 0;
            white-space: pre-wrap;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer-text {
            color: #666;
            font-size: 13px;
            margin: 5px 0;
        }
        .footer-link {
            color: #1a1a1a;
            text-decoration: none;
            font-weight: 500;
        }
        .signature {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid #e0e0e0;
        }
        .signature-name {
            color: #1a1a1a;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 5px;
        }
        .signature-team {
            color: #666;
            font-size: 13px;
        }
        .reply-notice {
            background-color: #f8f9fa;
            border-left: 4px solid #1a1a1a;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .reply-notice-text {
            color: #1a1a1a;
            font-size: 15px;
            margin: 0;
            font-weight: 500;
        }
        .reply-content {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            color: #333;
            font-size: 15px;
            white-space: pre-wrap;
            line-height: 1.8;
        }
        .section-title {
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 600;
            margin: 30px 0 15px 0;
        }
        .service-list {
            margin: 15px 0;
            padding-left: 20px;
        }
        .service-list li {
            margin: 8px 0;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">TRENDSIGNITE</h1>
            <p class="tagline">Influencer Marketing & Management</p>
        </div>
        <div class="content">
            ${content}
        </div>
        ${showFooter ? `
        <div class="footer">
            <p class="footer-text">Reply to this email to continue the conversation.</p>
            <p class="footer-text">
                <a href="https://www.trendsignite.com" class="footer-link">www.trendsignite.com</a>
            </p>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
}

/**
 * Generate automated reply email template
 */
export function generateAutomatedReply(
    customerName: string,
    ticketNumber: string
): string {
    const content = `
        <div class="greeting">Hello ${customerName}!</div>
        
        <div class="ticket-badge">Ticket #${ticketNumber}</div>
        
        <div class="message-content">
Thank you for reaching out to TrendsIgnite! We've received your inquiry and our team will get back to you as soon as possible.

Yes, we can help you!

Our influencer marketing and management services are designed to help your brand reach new heights. We work with influencers and celebrities to amplify your message and deliver the results you're looking for.
        </div>
        
        <div class="section-title">Our Services:</div>
        <ul class="service-list">
            <li>Influencer Marketing: $500 - $4,000</li>
            <li>Management Services: $600 - $1,000</li>
        </ul>
        
        <div class="message-content">
Would you like to proceed to speak with one of our team members? Simply reply to this email and we'll connect you with the right person.
        </div>
        
        <div class="signature">
            <div class="signature-name">TrendsIgnite Team</div>
        </div>
    `;
    
    return getEmailHTML(content);
}

/**
 * Generate team notification email when customer replies
 */
export function generateTeamNotification(
    ticket: {
        ticketNumber: string;
        customerName: string;
        customerEmail: string;
        initialMessage: string;
        status: string;
        createdAt: Date;
    },
    customerReply: {
        subject: string;
        body: string;
        receivedAt: Date;
    }
): { subject: string; body: string } {
    const subject = `[Ticket ${ticket.ticketNumber}] New Reply from ${ticket.customerName}`;
    
    // Clean up the reply body - remove quoted/forwarded content
    const lines = customerReply.body.split('\n');
    const cleanedLines: string[] = [];
    let inQuotedSection = false;
    
    for (const line of lines) {
        const trimmed = line.trim();
        // Detect start of quoted section
        if (trimmed.startsWith('>') || 
            (trimmed.startsWith('On ') && trimmed.includes('wrote:')) ||
            (trimmed.includes('From:') && trimmed.includes('trendsignite.com')) ||
            trimmed.includes('Sent:') ||
            (trimmed.includes('To:') && trimmed.includes('trendsignite.com'))) {
            inQuotedSection = true;
            continue;
        }
        // Stop at separator lines that indicate quoted content
        if (inQuotedSection && (trimmed === '---' || trimmed.startsWith('Ticket ID:') || trimmed.includes('Reply to this email'))) {
            break;
        }
        if (!inQuotedSection) {
            cleanedLines.push(line);
        }
    }
    
    let cleanReplyBody = cleanedLines.join('\n').trim();
    
    // If we removed everything, use first part of original (might be a short reply)
    if (!cleanReplyBody || cleanReplyBody.length < 10) {
        cleanReplyBody = customerReply.body.split('\n').slice(0, 20).join('\n').trim();
    }
    
    // Escape HTML in the reply body
    const escapedReplyBody = cleanReplyBody
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    const escapedInitialMessage = ticket.initialMessage
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    const content = `
        <div class="greeting">New Customer Reply</div>
        
        <div class="ticket-badge">Ticket #${ticket.ticketNumber}</div>
        
        <div class="section-title">Ticket Information</div>
        <div class="message-content">
<strong>Customer:</strong> ${ticket.customerName} (${ticket.customerEmail})<br>
<strong>Status:</strong> ${ticket.status}<br>
<strong>Created:</strong> ${ticket.createdAt.toLocaleString()}<br>
<strong>Received:</strong> ${customerReply.receivedAt.toLocaleString()}
        </div>
        
        <div class="section-title">Customer's Reply</div>
        <div class="reply-content">${escapedReplyBody}</div>
        
        <div class="section-title">Original Inquiry</div>
        <div class="message-content">${escapedInitialMessage}</div>
        
        <div class="message-content" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tickets/${ticket.ticketNumber}" style="color: #1a1a1a; font-weight: 500;">View in Dashboard</a>
        </div>
        
        <div class="message-content" style="color: #666; font-size: 13px;">
            To reply: Reply directly to the customer's email (${ticket.customerEmail})
        </div>
    `;
    
    const body = getEmailHTML(content, false);
    
    return { subject, body };
}

/**
 * Generate customer notification when team member replies
 */
export function generateCustomerNotification(
    customerName: string,
    ticketNumber: string,
    teamMemberEmail: string,
    teamReply: {
        subject: string;
        body: string;
    }
): { subject: string; body: string } {
    // Extract team member name from email (e.g., "izuru@trendsignite.com" -> "Izuru")
    const emailParts = teamMemberEmail.split('@')[0];
    const teamMemberName = emailParts
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    
    // Clean up the team reply body - remove quoted/forwarded content
    const lines = teamReply.body.split('\n');
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
            trimmed.includes('Ticket ID:') ||
            trimmed.includes('Reply to this email') ||
            trimmed.includes('TRENDSIGNITE') ||
            trimmed.includes('has replied to your ticket')) {
            inQuotedSection = true;
            continue;
        }
        // Stop at separator lines
        if (inQuotedSection && (trimmed === '---' || trimmed.startsWith('━━'))) {
            break;
        }
        if (!inQuotedSection) {
            cleanedLines.push(line);
        }
    }
    
    let cleanReplyBody = cleanedLines.join('\n').trim();
    
    // If we removed everything, use first part of original
    if (!cleanReplyBody || cleanReplyBody.length < 10) {
        cleanReplyBody = teamReply.body.split('\n').slice(0, 30).join('\n').trim();
    }
    
    // Escape HTML in the reply body
    const escapedReplyBody = cleanReplyBody
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    const subject = `Re: [Ticket ${ticketNumber}] Your inquiry to TrendsIgnite`;
    
    const content = `
        <div class="greeting">Hello ${customerName}!</div>
        
        <div class="ticket-badge">Ticket #${ticketNumber}</div>
        
        <div class="reply-notice">
            <p class="reply-notice-text">${teamMemberName} from TrendsIgnite has replied to your ticket:</p>
        </div>
        
        <div class="reply-content">${escapedReplyBody}</div>
        
        <div class="signature">
            <div class="signature-name">${teamMemberName}</div>
            <div class="signature-team">TrendsIgnite Team</div>
        </div>
    `;
    
    const body = getEmailHTML(content);
    
    return { subject, body };
}

/**
 * Generate team notification email when a new ticket is created
 */
export function generateTeamNewTicketNotification(
    ticketNumber: string,
    customerName: string,
    customerEmail: string,
    customerMessage: string
): { subject: string; body: string } {
    const subject = `[New Ticket ${ticketNumber}] Contact Form Submission from ${customerName}`;
    
    // Escape HTML in user content
    const escapedMessage = customerMessage
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    const content = `
        <div class="greeting">New Ticket Created</div>
        
        <div class="ticket-badge">Ticket #${ticketNumber}</div>
        
        <div class="message-content">
A new ticket has been created from the contact form.
        </div>
        
        <div class="section-title">Ticket Information</div>
        <div class="message-content">
<strong>Customer:</strong> ${customerName} (${customerEmail})<br>
<strong>Status:</strong> open<br>
<strong>Created:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="section-title">Customer Message</div>
        <div class="reply-content">${escapedMessage}</div>
        
        <div class="message-content" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tickets/${ticketNumber}" style="color: #1a1a1a; font-weight: 500;">View in Dashboard</a>
        </div>
    `;
    
    const body = getEmailHTML(content, false);
    
    return { subject, body };
}

/**
 * Generate log notification for team replies (sent to tickets-log email)
 */
export function generateTeamReplyLogNotification(
    ticketNumber: string,
    customerName: string,
    customerEmail: string,
    teamMemberEmail: string,
    teamReply: {
        subject: string;
        body: string;
    }
): { subject: string; body: string } {
    // Extract team member name from email
    const emailParts = teamMemberEmail.split('@')[0];
    const teamMemberName = emailParts
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    
    // Clean up the team reply body
    const lines = teamReply.body.split('\n');
    const cleanedLines: string[] = [];
    let inQuotedSection = false;
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('>') || 
            (trimmed.startsWith('On ') && trimmed.includes('wrote:')) ||
            (trimmed.includes('From:') && trimmed.includes('trendsignite.com')) ||
            trimmed.includes('Sent:') ||
            (trimmed.includes('To:') && trimmed.includes('trendsignite.com')) ||
            trimmed.includes('Ticket ID:') ||
            trimmed.includes('Reply to this email') ||
            trimmed.includes('TRENDSIGNITE') ||
            trimmed.includes('has replied to your ticket')) {
            inQuotedSection = true;
            continue;
        }
        if (inQuotedSection && (trimmed === '---' || trimmed.startsWith('━━'))) {
            break;
        }
        if (!inQuotedSection) {
            cleanedLines.push(line);
        }
    }
    
    let cleanReplyBody = cleanedLines.join('\n').trim();
    if (!cleanReplyBody || cleanReplyBody.length < 10) {
        cleanReplyBody = teamReply.body.split('\n').slice(0, 30).join('\n').trim();
    }
    
    // Escape HTML
    const escapedReplyBody = cleanReplyBody
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    const subject = `[Team Reply] Ticket ${ticketNumber} - ${teamMemberName} replied`;
    
    const content = `
        <div class="greeting">Team Reply Logged</div>
        
        <div class="ticket-badge">Ticket #${ticketNumber}</div>
        
        <div class="section-title">Ticket Information</div>
        <div class="message-content">
<strong>Customer:</strong> ${customerName} (${customerEmail})<br>
<strong>Team Member:</strong> ${teamMemberName} (${teamMemberEmail})<br>
<strong>Sent:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="section-title">Team Reply</div>
        <div class="reply-content">${escapedReplyBody}</div>
        
        <div class="message-content" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tickets/${ticketNumber}" style="color: #1a1a1a; font-weight: 500;">View in Dashboard</a>
        </div>
    `;
    
    const body = getEmailHTML(content, false);
    
    return { subject, body };
}
