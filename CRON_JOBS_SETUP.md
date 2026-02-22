# Cron Jobs Setup for cron-job.org

Since you're using cron-job.org instead of Vercel cron, here are **ALL the cron jobs** you need to set up:

## Required Cron Jobs

### 1. Ticket Checking (Every 10 minutes)
- **URL**: `https://trendsignite-website.vercel.app/api/cron/check-tickets` (use HTTPS, not HTTP)
- **Schedule**: `*/10 * * * *` (every 10 minutes)
- **Method**: GET
- **Headers**:
  - **Name**: `Authorization`
  - **Value**: `Bearer YOUR_CRON_SECRET` (replace YOUR_CRON_SECRET with actual value)
- **Purpose**: Checks for new customer replies and auto-closes expired tickets

**Important**: 
- Use **HTTPS** URL (not HTTP) to avoid permanent redirects
- Make sure there's **no trailing slash** in the URL
- The Authorization header must be exactly: `Bearer <your-secret>` (with a space after "Bearer")

### 2. Daily Analytics Summary (Daily at 1 AM)
- **URL**: `https://your-domain.vercel.app/api/cron/analytics-daily-summary`
- **Schedule**: `0 1 * * *` (daily at 1:00 AM)
- **Method**: GET
- **Headers**:
  - `Authorization: Bearer YOUR_CRON_SECRET`
- **Purpose**: Creates daily summary records for analytics (enables 365-day view)

### 3. Analytics Cleanup (Daily at 2 AM)
- **URL**: `https://your-domain.vercel.app/api/cron/analytics-cleanup`
- **Schedule**: `0 2 * * *` (daily at 2:00 AM)
- **Method**: GET
- **Headers**:
  - `Authorization: Bearer YOUR_CRON_SECRET`
- **Purpose**: Deletes raw analytics data older than 180 days (keeps summaries)

### 4. Analytics Full Wipe (Weekly on Sunday at 3 AM)
- **URL**: `https://your-domain.vercel.app/api/cron/analytics-full-wipe`
- **Schedule**: `0 3 * * 0` (weekly on Sunday at 3:00 AM)
- **Method**: GET
- **Headers**:
  - `Authorization: Bearer YOUR_CRON_SECRET`
- **Purpose**: Deletes all analytics data older than 365 days

## Setup Instructions

1. **Sign up** at [cron-job.org](https://cron-job.org) (free account)

2. **For each cron job above:**
   - Click "Create cronjob"
   - Enter the **Title** (e.g., "Ticket Checker")
   - Enter the **URL** (use your production domain)
   - Set the **Schedule** (cron expression)
   - Set **Request Method** to GET
   - Click "Advanced" or "Request Options"
   - Add header:
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_CRON_SECRET` (get from `.env.local`)

3. **Activate** all cron jobs

4. **Test each one:**
   - Click "Execute now" on each cron job
   - Check Vercel logs to verify they're working

## Important Notes

- **Free tier limit**: cron-job.org free tier allows **1 cron job** that runs every 1 minute
- **Workaround**: You can create multiple cron jobs, but they'll share the same execution limit
- **Alternative**: Use GitHub Actions for some jobs if your repo is public (unlimited free)

## Get Your CRON_SECRET

Your `CRON_SECRET` is in your `.env.local` file:
```
CRON_SECRET=5b9015dc4f65f36c6ea2486ac9795f8d
```

Use this exact value in the Authorization header: `Bearer 5b9015dc4f65f36c6ea2486ac9795f8d`

## Replace Your Domain

Replace `your-domain.vercel.app` with your actual Vercel deployment URL (e.g., `trendsignite.vercel.app` or your custom domain).
