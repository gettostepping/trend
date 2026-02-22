# Free Cron Jobs Setup Guide

This project uses a **hybrid approach** for cron jobs:
- **Vercel Cron** (free) for daily/weekly jobs
- **cron-job.org** (free) for frequent ticket checking

## Vercel Cron Jobs (Free on Hobby Plan)

These run automatically via Vercel:

1. **Daily Analytics Summary** - Runs daily at 1 AM
2. **Analytics Cleanup** - Runs daily at 2 AM (deletes raw data older than 180 days)
3. **Analytics Full Wipe** - Runs weekly on Sunday at 3 AM (deletes everything older than 365 days)

## External Cron Job Setup (cron-job.org)

For ticket checking (every 10 minutes), we use **cron-job.org** because:
- Vercel Hobby plan only allows daily cron jobs
- cron-job.org free tier allows 1 job every 1 minute
- Perfect for frequent email polling

### Setup Instructions

1. **Sign up** at [cron-job.org](https://cron-job.org) (free account)

2. **Create a new cron job:**
   - Click "Create cronjob"
   - **Title**: TrendsIgnite Ticket Checker
   - **Address (URL)**: `https://your-domain.com/api/cron/check-tickets`
   - **Schedule**: `*/10 * * * *` (every 10 minutes)
   - **Request Method**: GET

3. **Add Authorization Header:**
   - Click "Advanced" or "Request Options"
   - Add header:
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_CRON_SECRET`
   - (Get `CRON_SECRET` from your `.env.local` file)

4. **Save and activate** the cron job

5. **Test it:**
   - Click "Execute now" to test
   - Check your Vercel logs to see if it worked

### Alternative: GitHub Actions (if repo is public)

If your GitHub repo is **public**, you can use GitHub Actions for free:

1. Create `.github/workflows/ticket-check.yml`:
```yaml
name: Check Tickets

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  check-tickets:
    runs-on: ubuntu-latest
    steps:
      - name: Check for ticket replies
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/check-tickets
```

2. Add `CRON_SECRET` to GitHub Secrets:
   - Go to repo → Settings → Secrets and variables → Actions
   - Add secret: `CRON_SECRET` = your secret value

3. Push the workflow file to GitHub

**Note**: GitHub Actions is free for public repos, but private repos only get 2,000 minutes/month free.

## Cost Summary

✅ **All cron jobs are FREE:**
- Vercel cron: Free on Hobby plan (daily jobs only)
- cron-job.org: Free (1 job, every 1 minute)
- GitHub Actions: Free for public repos

## Troubleshooting

### cron-job.org not working?

1. Check the URL is correct (use your production domain)
2. Verify `CRON_SECRET` header matches your `.env` file
3. Check Vercel logs for errors
4. Test the endpoint manually: `curl -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/cron/check-tickets`

### Vercel cron jobs not running?

1. Make sure you're on Hobby plan (or upgrade to Pro)
2. Check `vercel.json` syntax is correct
3. Verify environment variables are set in Vercel dashboard
4. Check Vercel logs for cron execution

## Monitoring

- **Vercel**: Check deployment logs for cron job executions
- **cron-job.org**: Dashboard shows execution history and success/failure
- **GitHub Actions**: Check Actions tab for workflow runs
