import { google } from 'googleapis';

// Get redirect URI - use environment variable or default to localhost
const getRedirectUri = () => {
    if (process.env.GMAIL_REDIRECT_URI) {
        return process.env.GMAIL_REDIRECT_URI;
    }
    // Default to localhost for development
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000/api/auth/google/callback';
    }
    // For production, you should set GMAIL_REDIRECT_URI
    return process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
        : 'http://localhost:3000/api/auth/google/callback';
};

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    getRedirectUri()
);

// Set refresh token if available
if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
}

export function getAuthUrl(): string {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly', // Needed to read emails for ticket replies
        'https://www.googleapis.com/auth/gmail.modify', // Needed to mark emails as read
    ];

    // Ensure we're using the correct redirect URI
    const redirectUri = getRedirectUri();

    return oauth2Client.generateAuthUrl({
        redirect_uri: redirectUri,
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent', // Force consent to get refresh token
    });
}

export async function getTokensFromCode(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function sendEmailViaGmail(
    to: string,
    subject: string,
    text: string,
    fromEmail?: string
) {
    if (!process.env.GMAIL_REFRESH_TOKEN) {
        throw new Error('Gmail refresh token not configured. Please complete OAuth setup.');
    }

    // Refresh the access token
    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const accessToken = await oauth2Client.getAccessToken();
    
    if (!accessToken.token) {
        throw new Error('Failed to get access token');
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Check if text is HTML (starts with <!DOCTYPE or <html)
    const isHTML = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    const contentType = isHTML 
        ? 'text/html; charset=utf-8' 
        : 'text/plain; charset=utf-8';
    
    // Use the provided fromEmail or default to GMAIL_USER
    const senderEmail = fromEmail || process.env.GMAIL_USER || 'noreply@trendsignite.com';
    
    // Create email message
    const email = [
        `To: ${to}`,
        `From: ${senderEmail}`,
        `Subject: ${subject}`,
        `Content-Type: ${contentType}`,
        '',
        text,
    ].join('\n');

    // Encode to base64url format
    const encodedMessage = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    // If fromEmail is different from GMAIL_USER, use "sendAs" parameter
    // Note: This requires the "sendAs" alias to be set up in Google Workspace Admin
    // The alias must be verified and the authenticated account must have permission to send as it
    const sendAsEmail = fromEmail && fromEmail !== process.env.GMAIL_USER ? fromEmail : undefined;

    const sendParams: any = {
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
        },
    };

    // Add sendAsEmail if sending from a different address
    if (sendAsEmail) {
        sendParams.sendAsEmail = sendAsEmail;
    }

    const response = await gmail.users.messages.send(sendParams);

    return response.data;
}

export { oauth2Client };
