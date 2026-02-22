# Cloudflare Setup Guide

This guide will help you set up Cloudflare for your TrendsIgnite website to enable DDoS protection, CDN, and IP geolocation.

## Why Cloudflare?

- **Free DDoS Protection** - Automatic protection against attacks
- **CDN** - Faster load times globally
- **Free SSL** - Automatic HTTPS certificates
- **IP Geolocation** - Free country detection via headers
- **Security** - Web Application Firewall (WAF) and bot protection
- **Performance** - Caching and optimization

## Important: Cloudflare Does NOT Replace Vercel Hosting

**You can use Cloudflare's nameservers while still hosting on Vercel!**

Cloudflare acts as a **proxy/CDN layer** in front of Vercel:
- **DNS**: Cloudflare handles DNS resolution
- **Proxy**: Cloudflare proxies requests to Vercel (your actual hosting)
- **Hosting**: Vercel still builds and hosts your Next.js/TypeScript application
- **Traffic Flow**: User → Cloudflare → Vercel → Your App

This is a **very common setup** and is the recommended way to use Cloudflare with Vercel. Your TypeScript/Next.js code still runs on Vercel - Cloudflare just sits in front of it for protection and performance.

## Setup Steps

### 1. Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for a free account
3. Verify your email

### 2. Add Your Domain

1. Click "Add a Site" in the Cloudflare dashboard
2. Enter your domain name (e.g., `trendsignite.com`)
3. Select the **Free** plan
4. Click "Continue"

### 3. Review DNS Records

Cloudflare will automatically scan your existing DNS records. Review them:

- **A Record**: Points to your Vercel deployment IP (or use CNAME)
- **CNAME Records**: For subdomains (www, api, etc.)
- **MX Records**: For email (if you have custom email)

**Important**: For Vercel deployments, you typically want:
- Root domain (`trendsignite.com`): Use CNAME to `cname.vercel-dns.com` OR A record pointing to Vercel
- www subdomain (`www.trendsignite.com`): CNAME to `cname.vercel-dns.com`

**How it works**: 
- DNS records point to **Vercel** (your actual hosting)
- Cloudflare **proxies** the traffic (orange cloud = proxied)
- Requests go: User → Cloudflare → Vercel → Your Next.js App
- Vercel still builds and runs your TypeScript/Next.js code

### 4. Update Nameservers

Cloudflare will provide you with nameservers (e.g., `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`).

1. Copy the nameservers from Cloudflare
2. Go to your domain registrar (where you bought the domain)
3. Find DNS/Nameserver settings
4. Replace your current nameservers with Cloudflare's nameservers
5. Save changes

**Note**: DNS propagation can take 24-48 hours, but usually happens within a few hours.

### 5. Enable Proxy (Orange Cloud)

In Cloudflare DNS settings, make sure the **proxy status** is set to **Proxied** (orange cloud icon) for:
- Your root domain A/CNAME record
- www subdomain
- Any other subdomains you want protected

**Important**: The orange cloud (Proxied) is required for:
- DDoS protection
- CDN benefits
- IP geolocation headers (`CF-IPCountry`, `CF-Connecting-IP`)

### 6. SSL/TLS Settings

1. Go to **SSL/TLS** in Cloudflare dashboard
2. Set encryption mode to **Full** (or **Full (strict)** if you have SSL on Vercel)
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### 7. Security Settings (Recommended)

1. Go to **Security** → **WAF**
2. Enable **Security Level**: Medium (or High for stricter protection)
3. Enable **Bot Fight Mode** (free tier)
4. Go to **Security** → **Settings**
5. Enable **Challenge Passage**: 30 minutes
6. Enable **Browser Integrity Check**

### 8. Performance Settings (Optional)

1. Go to **Speed** → **Optimization**
2. Enable **Auto Minify** (HTML, CSS, JavaScript)
3. Enable **Brotli** compression
4. Enable **Rocket Loader** (optional - can cause issues with some sites)

### 9. Verify Setup

After DNS propagation (check with `nslookup` or online DNS checker):

1. Visit your website
2. Check browser DevTools → Network → Headers
3. Look for `CF-IPCountry` header (should show country code)
4. Look for `CF-Connecting-IP` header (should show real user IP)

### 10. Update Vercel Settings

**Important**: You still need to configure Vercel!

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain if not already added (e.g., `trendsignite.com` and `www.trendsignite.com`)
3. Vercel will automatically detect Cloudflare DNS
4. Vercel will provide you with the correct DNS records to use in Cloudflare

**The setup flow**:
1. Add domain in Vercel → Get DNS records from Vercel
2. Add domain in Cloudflare → Use Cloudflare's nameservers
3. In Cloudflare DNS, add the records Vercel provided (pointing to Vercel)
4. Enable proxy (orange cloud) in Cloudflare
5. Traffic flows: User → Cloudflare (proxy) → Vercel (hosting) → Your App

## Testing IP Geolocation

Once Cloudflare is set up, test that IP geolocation works:

1. Visit your site from different locations/VPNs
2. Check the analytics dashboard
3. Verify country data is being tracked correctly

## Troubleshooting

### Cloudflare headers not appearing

- **Check proxy status**: Make sure records are "Proxied" (orange cloud), not "DNS only" (grey cloud)
- **Wait for DNS propagation**: Can take up to 48 hours
- **Clear browser cache**: Sometimes headers are cached
- **Check Cloudflare dashboard**: Verify domain is active and proxied

### Website not loading

- **Check DNS records**: Make sure A/CNAME records point to correct Vercel deployment
- **Check SSL mode**: Set to "Full" or "Full (strict)" in Cloudflare
- **Check Vercel**: Ensure domain is added in Vercel dashboard

### Analytics not tracking countries

- **Verify headers**: Use browser DevTools to check for `CF-IPCountry` header
- **Check code**: Ensure `trackPageView` is receiving Cloudflare headers
- **Test API route**: Check `/api/analytics/track` endpoint logs

## Cloudflare Free Tier Limits

- **Unlimited bandwidth** ✅
- **Unlimited requests** ✅
- **DDoS protection** ✅
- **CDN** ✅
- **SSL certificates** ✅
- **WAF rules**: 5 rules (usually enough)
- **Page Rules**: 3 rules
- **Analytics**: 24 hours of data

## Next Steps

After Cloudflare is set up:

1. Run database migrations: `npx prisma migrate dev`
2. Deploy to Vercel
3. Test analytics tracking
4. Monitor Cloudflare dashboard for security events

## Support

- Cloudflare Docs: https://developers.cloudflare.com/
- Cloudflare Community: https://community.cloudflare.com/
- Vercel + Cloudflare: https://vercel.com/docs/edge-network/cloudflare
