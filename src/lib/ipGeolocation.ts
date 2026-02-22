'use server';

import prisma from '@/lib/prisma';

interface GeolocationResult {
  country: string | null;
  fromCache: boolean;
}

/**
 * Get country from IP address using Cloudflare headers or ip-api.com
 * Results are cached in database to reduce API calls
 */
export async function getCountryFromIP(
  ip: string | null | undefined,
  cloudflareCountry?: string | null
): Promise<GeolocationResult> {
  // If no IP provided, return null
  if (!ip) {
    return { country: null, fromCache: false };
  }

  // Priority 1: Use Cloudflare header if available
  if (cloudflareCountry) {
    // Cache it for future use
    try {
      await prisma.iPCountryCache.upsert({
        where: { ip },
        update: { country: cloudflareCountry, updatedAt: new Date() },
        create: { ip, country: cloudflareCountry },
      });
    } catch (error) {
      console.error('Error caching Cloudflare country:', error);
    }
    return { country: cloudflareCountry, fromCache: false };
  }

  // Priority 2: Check database cache
  try {
    const cached = await prisma.iPCountryCache.findUnique({
      where: { ip },
    });

    if (cached) {
      return { country: cached.country, fromCache: true };
    }
  } catch (error) {
    console.error('Error checking IP cache:', error);
  }

  // Priority 3: Fetch from ip-api.com (free tier: 45 req/min)
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode`, {
      headers: {
        'User-Agent': 'TrendsIgnite Analytics',
      },
    });

    if (!response.ok) {
      throw new Error(`ip-api.com returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success' && data.countryCode) {
      const country = data.countryCode;

      // Cache the result
      try {
        await prisma.iPCountryCache.upsert({
          where: { ip },
          update: { country, updatedAt: new Date() },
          create: { ip, country },
        });
      } catch (cacheError) {
        console.error('Error caching IP country:', cacheError);
      }

      return { country, fromCache: false };
    }
  } catch (error) {
    console.error('Error fetching country from ip-api.com:', error);
    // If API fails, return null (don't throw - analytics should still work)
  }

  return { country: null, fromCache: false };
}
