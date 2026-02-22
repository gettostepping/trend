'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { trackClickEvent, trackWebVital } from '@/app/actions/analytics';

interface WebVitalMetric {
    name: string;
    value: number;
    delta: number;
    id: string;
    rating: 'good' | 'needs-improvement' | 'poor';
}

// Generate or retrieve session ID
function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    const storageKey = 'trendsignite_session_id';
    const sessionExpiry = 30 * 60 * 1000; // 30 minutes
    const stored = localStorage.getItem(storageKey);
    const storedTime = localStorage.getItem(`${storageKey}_time`);
    
    if (stored && storedTime) {
        const time = parseInt(storedTime, 10);
        if (Date.now() - time < sessionExpiry) {
            return stored;
        }
    }
    
    // Generate new session ID
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, newSessionId);
    localStorage.setItem(`${storageKey}_time`, Date.now().toString());
    return newSessionId;
}

// Get screen resolution
function getScreenResolution(): string {
    if (typeof window === 'undefined') return '';
    return `${window.screen.width}x${window.screen.height}`;
}

// Store screen resolution once per session
function getStoredScreenResolution(sessionId: string): string {
    if (typeof window === 'undefined') return '';
    const storageKey = `trendsignite_resolution_${sessionId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;
    
    const resolution = getScreenResolution();
    localStorage.setItem(storageKey, resolution);
    return resolution;
}

export function useAnalytics() {
    const pathname = usePathname();
    const sessionIdRef = useRef<string>('');
    const screenResolutionRef = useRef<string>('');
    const hasTrackedPageViewRef = useRef(false);
    const webVitalsTrackedRef = useRef<Set<string>>(new Set());

    // Initialize session
    useEffect(() => {
        sessionIdRef.current = getSessionId();
        screenResolutionRef.current = getStoredScreenResolution(sessionIdRef.current);
    }, []);

    // Track page view on route change
    useEffect(() => {
        if (!sessionIdRef.current || hasTrackedPageViewRef.current) return;
        
        hasTrackedPageViewRef.current = true;
        
        const track = async () => {
            try {
                // Call API route to track page view (allows access to Cloudflare headers)
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        path: pathname || '/',
                        referrer: document.referrer || undefined,
                        userAgent: navigator.userAgent,
                        sessionId: sessionIdRef.current,
                        screenResolution: screenResolutionRef.current,
                    }),
                });
            } catch (error) {
                console.error('Error tracking page view:', error);
            }
        };

        track();
        
        // Reset flag after a delay to allow for route changes
        const timer = setTimeout(() => {
            hasTrackedPageViewRef.current = false;
        }, 1000);

        return () => clearTimeout(timer);
    }, [pathname]);

    // Track click events
    const trackClick = useCallback((element: string, elementId?: string) => {
        if (!sessionIdRef.current) return;
        
        trackClickEvent({
            element,
            elementId,
            path: pathname || '/',
            sessionId: sessionIdRef.current,
        }).catch(error => {
            console.error('Error tracking click event:', error);
        });
    }, [pathname]);

    // Track Web Vitals
    const trackVital = useCallback(async (metric: WebVitalMetric) => {
        if (!sessionIdRef.current) return;
        
        // Prevent duplicate tracking
        const vitalKey = `${metric.name}_${metric.id}`;
        if (webVitalsTrackedRef.current.has(vitalKey)) return;
        webVitalsTrackedRef.current.add(vitalKey);

        try {
            await trackWebVital({
                sessionId: sessionIdRef.current,
                path: pathname || '/',
                metric: metric.name as 'lcp' | 'inp' | 'cls' | 'ttfb' | 'fcp' | 'tbt',
                value: metric.value,
            });
        } catch (error) {
            console.error('Error tracking web vital:', error);
        }
    }, [pathname]);

    return {
        sessionId: sessionIdRef.current,
        trackClick,
        trackVital,
    };
}

// Web Vitals collection using web-vitals library or manual collection
export function useWebVitals() {
    const { trackVital } = useAnalytics();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Track LCP (Largest Contentful Paint)
        try {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
                const value = lastEntry.renderTime || lastEntry.loadTime || 0;
                
                trackVital({
                    name: 'lcp',
                    value: value / 1000, // Convert to seconds
                    delta: value / 1000,
                    id: lastEntry.name || 'lcp',
                    rating: value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor',
                });
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            // Browser doesn't support LCP
        }

        // Track INP (Interaction to Next Paint) - simplified version
        let interactionStartTime = 0;
        document.addEventListener('click', () => {
            interactionStartTime = performance.now();
        }, true);
        
        document.addEventListener('click', () => {
            const delay = performance.now() - interactionStartTime;
            if (delay > 0 && delay < 10000) { // Reasonable threshold
                trackVital({
                    name: 'inp',
                    value: delay,
                    delta: delay,
                    id: `inp_${Date.now()}`,
                    rating: delay <= 200 ? 'good' : delay <= 500 ? 'needs-improvement' : 'poor',
                });
            }
        }, true);

        // Track CLS (Cumulative Layout Shift)
        try {
            let clsValue = 0;
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!(entry as any).hadRecentInput) {
                        clsValue += (entry as any).value;
                    }
                }
                
                // Track CLS periodically
                setTimeout(() => {
                    if (clsValue > 0) {
                        trackVital({
                            name: 'cls',
                            value: clsValue,
                            delta: clsValue,
                            id: 'cls',
                            rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
                        });
                    }
                }, 5000);
            }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            // Browser doesn't support CLS
        }

        // Track TTFB (Time to First Byte)
        try {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
                const ttfb = navigation.responseStart - navigation.requestStart;
                trackVital({
                    name: 'ttfb',
                    value: ttfb,
                    delta: ttfb,
                    id: 'ttfb',
                    rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
                });
            }
        } catch (e) {
            // Browser doesn't support Navigation Timing
        }

        // Track FCP (First Contentful Paint)
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        trackVital({
                            name: 'fcp',
                            value: entry.startTime / 1000, // Convert to seconds
                            delta: entry.startTime / 1000,
                            id: 'fcp',
                            rating: entry.startTime <= 1800 ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor',
                        });
                    }
                }
            }).observe({ type: 'paint', buffered: true });
        } catch (e) {
            // Browser doesn't support Paint Timing
        }

        // Track TBT (Total Blocking Time) - simplified
        try {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
                const tbt = navigation.domInteractive - navigation.domContentLoadedEventEnd;
                if (tbt > 0) {
                    trackVital({
                        name: 'tbt',
                        value: tbt,
                        delta: tbt,
                        id: 'tbt',
                        rating: tbt <= 200 ? 'good' : tbt <= 600 ? 'needs-improvement' : 'poor',
                    });
                }
            }
        } catch (e) {
            // Browser doesn't support Navigation Timing
        }
    }, [trackVital]);
}
