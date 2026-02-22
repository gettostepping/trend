"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const CORNER_THRESHOLD = 50; // pixels from edge to count as corner
const LOGO_CLICK_TIMEOUT = 2000; // 2 seconds for rapid logo clicks
const PATTERN_TIMEOUT = 5000; // 5 seconds to complete pattern before reset

// Pattern 1: Logo Click Sequence
// Click logo 3 times quickly → top-left corner → bottom-right corner → logo again
const PATTERN1_SEQUENCE = ['logo', 'logo', 'logo', 'top-left', 'bottom-right', 'logo'];

// Pattern 2: Secret Letter Pattern
// Click I twice → S once → T once → then click logo
const PATTERN2_SEQUENCE = ['I', 'I', 'S', 'T', 'logo'];

export function useAdminPuzzle() {
    const router = useRouter();
    const [pattern1Progress, setPattern1Progress] = useState(0);
    const [pattern2Progress, setPattern2Progress] = useState(0);
    const [currentLetterIndex, setCurrentLetterIndex] = useState(-1);
    const [visualFeedback, setVisualFeedback] = useState<{
        type: 'corner' | 'logo' | 'letter';
        position?: 'top-left' | 'bottom-right';
        letter?: string;
    } | null>(null);

    const pattern1Sequence = useRef<string[]>([]);
    const pattern2Sequence = useRef<string[]>([]);
    const logoClickTimes = useRef<number[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const letterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetPatterns = useCallback(() => {
        pattern1Sequence.current = [];
        pattern2Sequence.current = [];
        logoClickTimes.current = [];
        setPattern1Progress(0);
        setPattern2Progress(0);
        setCurrentLetterIndex(-1);
        setVisualFeedback(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (letterTimeoutRef.current) {
            clearTimeout(letterTimeoutRef.current);
            letterTimeoutRef.current = null;
        }
    }, []);

    const checkPattern1 = useCallback(() => {
        const current = pattern1Sequence.current;
        if (current.length === 0) return;

        // Check if we have the correct sequence
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== PATTERN1_SEQUENCE[i]) {
                resetPatterns();
                return;
            }
        }

        setPattern1Progress(current.length / PATTERN1_SEQUENCE.length);

        // If pattern is complete
        if (current.length === PATTERN1_SEQUENCE.length) {
            // Set flag to trigger loading animation in admin layout
            sessionStorage.setItem('adminLoading', 'true');
            router.push('/admin');
            resetPatterns();
        }
    }, [router, resetPatterns]);

    const checkPattern2 = useCallback(() => {
        const current = pattern2Sequence.current;
        if (current.length === 0) return;

        // Check if we have the correct sequence
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== PATTERN2_SEQUENCE[i]) {
                resetPatterns();
                return;
            }
        }

        setPattern2Progress(current.length / PATTERN2_SEQUENCE.length);

        // If pattern is complete (including logo click)
        if (current.length === PATTERN2_SEQUENCE.length) {
            // Set flag to trigger loading animation in admin layout
            sessionStorage.setItem('adminLoading', 'true');
            router.push('/admin');
            resetPatterns();
        }
    }, [router, resetPatterns]);

    const handleLogoClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const now = Date.now();

        // Track logo clicks for pattern 1
        logoClickTimes.current.push(now);
        logoClickTimes.current = logoClickTimes.current.filter(
            time => now - time < LOGO_CLICK_TIMEOUT
        );

        let isPartOfPattern = false;

        // Check if we have 3 rapid logo clicks for pattern 1
        if (logoClickTimes.current.length >= 3) {
            // Start pattern 1 sequence
            pattern1Sequence.current = ['logo', 'logo', 'logo'];
            checkPattern1();
            isPartOfPattern = true;
        } else {
            // Check if we're in the middle of pattern 1
            if (pattern1Sequence.current.length > 0 && pattern1Sequence.current.length < PATTERN1_SEQUENCE.length) {
                pattern1Sequence.current.push('logo');
                checkPattern1();
                isPartOfPattern = true;
            }
            // Check if we're waiting for final logo click in pattern 2
            else if (pattern2Sequence.current.length === PATTERN2_SEQUENCE.length - 1) {
                pattern2Sequence.current.push('logo');
                checkPattern2();
                isPartOfPattern = true;
            }
        }

        // Only show visual feedback if logo click is part of an active pattern
        if (isPartOfPattern) {
            setVisualFeedback({ type: 'logo' });
            setTimeout(() => setVisualFeedback(null), 300);
        }

        // Reset timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(resetPatterns, PATTERN_TIMEOUT);
    }, [checkPattern1, checkPattern2, resetPatterns]);

    const handleCornerClick = useCallback((corner: 'top-left' | 'bottom-right', e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Check if we're in pattern 1 sequence
        if (pattern1Sequence.current.length >= 3 && pattern1Sequence.current.length < PATTERN1_SEQUENCE.length) {
            pattern1Sequence.current.push(corner);
            checkPattern1();
        } else {
            resetPatterns();
        }

        setVisualFeedback({ type: 'corner', position: corner });
        setTimeout(() => setVisualFeedback(null), 500);

        // Reset timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(resetPatterns, PATTERN_TIMEOUT);
    }, [checkPattern1, resetPatterns]);

    const handleLetterClick = useCallback((letter: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        const currentLength = pattern2Sequence.current.length;
        
        // Don't process logo clicks here - those are handled in handleLogoClick
        if (letter === 'logo') {
            return;
        }

        // Check if this letter matches the expected letter in the sequence
        const expectedLetter = PATTERN2_SEQUENCE[currentLength];
        
        if (letter === expectedLetter) {
            pattern2Sequence.current.push(letter);
            
            // Find which letter instance was clicked for highlighting
            // "TRENDSIGNITE" = T(0), R(1), E(2), N(3), D(4), S(5), I(6), G(7), N(8), I(9), T(10), E(11)
            // Pattern: I (first I at index 6), I (second I at index 9), S (at index 5), T (first T at index 0)
            let letterIndex = -1;
            const word = 'TRENDSIGNITE';
            
            if (letter === 'I') {
                if (currentLength === 0) {
                    // First I click - should be the first I (index 6)
                    letterIndex = 6;
                } else if (currentLength === 1) {
                    // Second I click - should be the second I (index 9)
                    letterIndex = 9;
                }
            } else if (letter === 'S') {
                // S click - should be S (index 5)
                letterIndex = 5;
            } else if (letter === 'T') {
                // T click - should be the first T (index 0)
                letterIndex = 0;
            }
            
            setCurrentLetterIndex(letterIndex);
            checkPattern2();
            
            setVisualFeedback({ type: 'letter', letter });
            if (letterTimeoutRef.current) clearTimeout(letterTimeoutRef.current);
            letterTimeoutRef.current = setTimeout(() => {
                setVisualFeedback(null);
                setCurrentLetterIndex(-1);
            }, 500);
        } else {
            resetPatterns();
        }

        // Reset timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(resetPatterns, PATTERN_TIMEOUT);
    }, [checkPattern2, resetPatterns]);

    const handleGlobalClick = useCallback((e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Check for corner clicks
        const isTopLeft = x < CORNER_THRESHOLD && y < CORNER_THRESHOLD;
        const isBottomRight = x > windowWidth - CORNER_THRESHOLD && y > windowHeight - CORNER_THRESHOLD;

        if (isTopLeft) {
            handleCornerClick('top-left', e as unknown as React.MouseEvent);
        } else if (isBottomRight) {
            handleCornerClick('bottom-right', e as unknown as React.MouseEvent);
        }
    }, [handleCornerClick]);

    useEffect(() => {
        window.addEventListener('click', handleGlobalClick);
        return () => {
            window.removeEventListener('click', handleGlobalClick);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (letterTimeoutRef.current) clearTimeout(letterTimeoutRef.current);
        };
    }, [handleGlobalClick]);

    return {
        handleLogoClick,
        handleLetterClick,
        pattern1Progress,
        pattern2Progress,
        currentLetterIndex,
        visualFeedback,
    };
}
