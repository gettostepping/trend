This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Cloudflare Setup (Recommended)

For DDoS protection, CDN, and free IP geolocation, set up Cloudflare:

1. **Sign up** at [cloudflare.com](https://cloudflare.com) (free account)
2. **Add your domain** in Cloudflare dashboard
3. **Update nameservers** at your domain registrar to Cloudflare's nameservers
4. **Enable proxy** (orange cloud icon) for your DNS records
5. **Done!** Cloudflare headers will automatically work

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed instructions.

**Benefits:**
- ✅ Free DDoS protection
- ✅ CDN for faster load times
- ✅ Free SSL certificates
- ✅ Free IP geolocation (no API calls needed)
- ✅ Web Application Firewall (WAF)
- ✅ Bot protection

The code automatically uses Cloudflare headers when available, and falls back to ip-api.com if not.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Database Configuration

```env
# PostgreSQL Database URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Example for local PostgreSQL:
DATABASE_URL="postgresql://user:password@localhost:5432/trendsignite?schema=public"

# For cloud databases (e.g., Supabase, Neon, Railway):
# DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Gmail API Configuration (for contact form & ticket system)

```env
# Gmail OAuth Credentials (from Google Cloud Console)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_USER=your-email@trendsignite.com

# OAuth redirect URI (for local development)
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Ticket System Configuration
TEAM_EMAILS=team1@trendsignite.com,team2@trendsignite.com
TICKETS_LOG_EMAIL=tickets-log@trendsignite.com
SEND_AUTO_CLOSE_EMAIL=true

# Cron Job Security (for ticket polling and analytics endpoints)
CRON_SECRET=your-random-secret-key
```

### Cloudflare (Optional but Recommended)

If you're using Cloudflare, no additional environment variables are needed. The code automatically detects Cloudflare headers (`CF-IPCountry`, `CF-Connecting-IP`) when your site is behind Cloudflare's proxy.

**To verify Cloudflare is working:**
- Check browser DevTools → Network → Headers for `CF-IPCountry` header
- Visit your site and check analytics dashboard for country data

**To get your refresh token:**
1. Visit `/admin/setup/gmail` in your browser
2. Click "Authorize with Google"
3. Grant permissions
4. Copy the refresh token and add it to your `.env.local` file

**For production:**
- Update `GMAIL_REDIRECT_URI` to your production domain
- Add the production redirect URI to your Google Cloud Console OAuth client
- **Vercel Cron Jobs**: The `vercel.json` file is already configured to run the ticket check every 10 minutes
  - Vercel will automatically add the `CRON_SECRET` to the `Authorization` header
  - Make sure to set `CRON_SECRET` in your Vercel project environment variables
  - The cron job will run automatically after deployment

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
