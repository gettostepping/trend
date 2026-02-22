'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { geoPath, geoMercator } from 'd3-geo';
import { feature } from 'topojson-client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import styles from './geographic.module.css';

// Country name to ISO code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
    'United States': 'US',
    'Canada': 'CA',
    'Mexico': 'MX',
    'Brazil': 'BR',
    'Argentina': 'AR',
    'United Kingdom': 'GB',
    'France': 'FR',
    'Germany': 'DE',
    'Italy': 'IT',
    'Spain': 'ES',
    'China': 'CN',
    'India': 'IN',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Indonesia': 'ID',
    'Thailand': 'TH',
    'South Africa': 'ZA',
    'Nigeria': 'NG',
    'Egypt': 'EG',
    'Australia': 'AU',
    'New Zealand': 'NZ',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Poland': 'PL',
    'Russia': 'RU',
    'Turkey': 'TR',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Philippines': 'PH',
    'Malaysia': 'MY',
    'Singapore': 'SG',
    'Vietnam': 'VN',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Kenya': 'KE',
    'Israel': 'IL',
};

interface CountryData {
    country: string;
    count: number;
}

interface CustomWorldMapProps {
    countryData: CountryData[];
}

export default function CustomWorldMap({ countryData }: CustomWorldMapProps) {
    const [hoveredCountry, setHoveredCountry] = useState<{
        name: string;
        count: number;
    } | null>(null);
    const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);
    
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const mapRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const transformGroupRef = useRef<SVGGElement>(null);
    const currentTransform = useRef({ x: 0, y: 0, scale: 1 });

    // Track mouse position for tooltip with smooth spring animation
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    // Tighter spring for more immediate response to offset changes
    const smoothX = useSpring(mouseX, { stiffness: 800, damping: 60, mass: 0.3 });
    const smoothY = useSpring(mouseY, { stiffness: 800, damping: 60, mass: 0.3 });
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Track mouse position globally for accurate tooltip positioning
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            // Update motion values with viewport coordinates - substantially larger offset
            mouseX.set(e.clientX + 25);
            mouseY.set(e.clientY + 25);
        };
        
        window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
        
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
        };
    }, [mouseX, mouseY]);

    const [geoData, setGeoData] = useState<any>(null);
    const pathGenerator = useRef<ReturnType<typeof geoPath> | null>(null);

    // Initialize projection and path generator with higher resolution
    useEffect(() => {
        const projection = geoMercator()
            .scale(300)
            .center([0, 0])
            .translate([500, 250]);
        
        pathGenerator.current = geoPath().projection(projection);
    }, []);

    // Load world map TopoJSON
    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
            .then(res => res.json())
            .then(data => {
                // Convert TopoJSON to GeoJSON
                const countries = feature(data, data.objects.countries) as any;
                // Debug: log first country properties to see what's available
                if (countries && countries.features && countries.features.length > 0) {
                    console.log('Sample country properties:', countries.features[0].properties);
                }
                setGeoData(countries);
            })
            .catch(err => console.error('Error loading map data:', err));
    }, []);

    // Create country count map - handle both country names and codes
    // Also create a reverse map for country names to counts
    const countryCountMap = useMemo(() => {
        const map = new Map<string, number>();
        const nameMap = new Map<string, number>();
        
        countryData.forEach(({ country, count }) => {
            // Store by country name for direct lookup
            nameMap.set(country, count);
            
            // If country is already a code (2-3 letters), use it directly
            if (country.length <= 3 && country === country.toUpperCase()) {
                map.set(country, count);
                map.set(country.toUpperCase(), count);
            } else {
                // Otherwise, convert name to code
                const countryCode = COUNTRY_NAME_TO_CODE[country];
                if (countryCode) {
                    map.set(countryCode, count);
                    map.set(countryCode.toUpperCase(), count);
                    // Also store variations
                    map.set(country, count); // Store by name too
                }
            }
        });
        
        // Store nameMap in the map object for access
        (map as any).nameMap = nameMap;
        return map;
    }, [countryData]);

    // Get max count for color intensity
    const maxCount = useMemo(() => {
        return Math.max(...Array.from(countryCountMap.values()), 1);
    }, [countryCountMap]);

    const getFillColor = useCallback((countryId: string, isHovered: boolean) => {
        // Highlight hovered country
        if (isHovered) {
            return '#1A73E8'; // Bright blue for hover
        }
        
        const count = countryCountMap.get(countryId) || 0;
        if (count === 0) return '#2a2a2a';
        
        const intensity = count / maxCount;
        const r = Math.floor(26 + (intensity * 50));
        const g = Math.floor(115 + (intensity * 100));
        const b = Math.floor(232 - (intensity * 50));
        
        return `rgb(${r}, ${g}, ${b})`;
    }, [countryCountMap, maxCount]);

    // Update transform group directly for smooth dragging (no re-renders)
    const updateTransformGroup = useCallback((x: number, y: number, scale: number) => {
        if (transformGroupRef.current) {
            transformGroupRef.current.setAttribute(
                'transform',
                `translate(${x}, ${y}) scale(${scale})`
            );
        }
        currentTransform.current = { x, y, scale };
    }, []);

    // Pan handlers - use direct DOM manipulation for smooth 60fps dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - currentTransform.current.x,
            y: e.clientY - currentTransform.current.y,
        });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            updateTransformGroup(newX, newY, currentTransform.current.scale);
        }
    }, [isDragging, dragStart, updateTransformGroup]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            // Sync state with current transform for consistency
            setTransform(currentTransform.current);
        }
    }, [isDragging]);

    // Prevent page scroll when hovering over map - but allow zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Don't prevent default here - let the React handler do it
        // This ensures zoom works while preventing page scroll
        
        return () => {
            // Cleanup handled by React
        };
    }, []);

    // Initialize transform group on mount and sync with state
    useEffect(() => {
        if (transformGroupRef.current) {
            currentTransform.current = transform;
            updateTransformGroup(transform.x, transform.y, transform.scale);
        }
    }, [transform.x === 0 && transform.y === 0 && transform.scale === 1, updateTransformGroup]);

    // Zoom handler - handle zoom in native event listener for better cross-browser support
    const handleZoom = useCallback((e: WheelEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const isOverMap = (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        );

        if (isOverMap) {
            e.preventDefault();
            e.stopPropagation();
            
            const delta = e.deltaY * -0.001;
            const newScale = Math.max(0.2, Math.min(5, currentTransform.current.scale + delta));
            
            // Zoom towards mouse position
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const scaleChange = newScale / currentTransform.current.scale;
            const newX = mouseX - (mouseX - currentTransform.current.x) * scaleChange;
            const newY = mouseY - (mouseY - currentTransform.current.y) * scaleChange;
            
            updateTransformGroup(newX, newY, newScale);
            setTransform({ x: newX, y: newY, scale: newScale });
        }
    }, [updateTransformGroup]);

    // Add native wheel event listener for all browsers
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleZoom, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleZoom);
        };
    }, [handleZoom]);


    // Country hover handlers
    const handleCountryMouseEnter = useCallback((e: React.MouseEvent, countryName: string, count: number, countryCode: string) => {
        if (countryCode) {
            setHoveredCountryCode(countryCode);
            // Use proper country name, not "Unknown"
            const displayName = countryName && countryName !== 'Unknown' && countryName !== 'unknown' ? countryName : countryCode;
            // Ensure count is a valid number
            const validCount = typeof count === 'number' && !isNaN(count) ? count : 0;
            setHoveredCountry({ name: displayName, count: validCount });
            // Initialize position immediately
            const nativeEvent = e.nativeEvent as MouseEvent;
            mouseX.set(nativeEvent.clientX + 25);
            mouseY.set(nativeEvent.clientY + 25);
        }
    }, [mouseX, mouseY]);

    const handleCountryMouseLeave = useCallback(() => {
        setHoveredCountry(null);
        setHoveredCountryCode(null);
    }, []);

    // Reset zoom
    const handleReset = useCallback(() => {
        setTransform({ x: 0, y: 0, scale: 1 });
    }, []);

    // Zoom in/out
    const handleZoomIn = useCallback(() => {
        setTransform(prev => ({
            ...prev,
            scale: Math.min(5, prev.scale * 1.2),
        }));
    }, []);

    const handleZoomOut = useCallback(() => {
        setTransform(prev => ({
            ...prev,
            scale: Math.max(0.2, prev.scale / 1.2),
        }));
    }, []);

    return (
        <div 
            ref={containerRef}
            className={styles.mapContainer}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{ 
                touchAction: 'none',
                userSelect: 'none',
                position: 'relative',
            }}
        >

            <div className={styles.mapControls}>
                <button onClick={handleZoomIn} className={styles.controlBtn}>+</button>
                <button onClick={handleZoomOut} className={styles.controlBtn}>−</button>
                <button onClick={handleReset} className={styles.controlBtn}>🌐</button>
            </div>

                <svg
                    ref={mapRef}
                    className={styles.customMapSvg}
                    viewBox="0 0 1000 500"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ 
                        shapeRendering: 'geometricPrecision',
                    }}
                >
                    <g
                        ref={transformGroupRef}
                        style={{ 
                            willChange: 'transform',
                        }}
                    >
                        {geoData && pathGenerator.current && geoData.features?.map((feature: any, index: number) => {
                            // world-atlas@2 uses different property names - check all possibilities
                            const props = feature.properties || {};
                            const countryCode = props.ISO_A2 || props.ISO_A3 || props.iso_a2 || props.iso_a3 || `country-${index}`;
                            
                            // Try all possible property names for country name
                            let countryName = props.NAME || 
                                             props.NAME_LONG || 
                                             props.NAME_EN || 
                                             props.NAME_SORT ||
                                             props.NAME_ALT ||
                                             props.ADMIN ||
                                             props.name ||
                                             props.name_long ||
                                             props.name_en ||
                                             props.admin;
                            
                            // Normalize country name (e.g., "United States of America" -> "United States")
                            if (countryName) {
                                countryName = countryName.replace(/\s+of\s+America$/i, '').trim();
                            }
                            
                            // If no name found, try to reverse lookup from our mapping using the code
                            if (!countryName && countryCode) {
                                const codeToName = Object.entries(COUNTRY_NAME_TO_CODE).find(([_, code]) => 
                                    code === countryCode || code === countryCode.toUpperCase()
                                );
                                if (codeToName) {
                                    countryName = codeToName[0];
                                }
                            }
                            
                            // Final fallback - use the code itself if we have it
                            if (!countryName) {
                                countryName = countryCode && countryCode !== `country-${index}` ? countryCode : 'Unknown';
                            }
                            
                            // Try multiple strategies to find the count
                            let count = 0;
                            const nameMap = (countryCountMap as any).nameMap;
                            
                            // Strategy 1: Direct code lookup
                            count = countryCountMap.get(countryCode) || 0;
                            
                            // Strategy 2: Try uppercase code
                            if (count === 0 && countryCode) {
                                count = countryCountMap.get(countryCode.toUpperCase()) || 0;
                            }
                            
                            // Strategy 3: Try by country name directly
                            if (count === 0 && countryName && nameMap) {
                                count = nameMap.get(countryName) || 0;
                            }
                            
                            // Strategy 4: Try normalized country name variations
                            if (count === 0 && countryName) {
                                // Try exact match first
                                count = countryCountMap.get(countryName) || 0;
                                
                                // Try common variations
                                if (count === 0) {
                                    const normalizedName = countryName.replace(/of America/gi, '').trim();
                                    count = nameMap?.get(normalizedName) || 0;
                                }
                                
                                // Try reverse lookup via code mapping
                                if (count === 0) {
                                    const nameToCode = COUNTRY_NAME_TO_CODE[countryName];
                                    if (nameToCode) {
                                        count = countryCountMap.get(nameToCode) || 0;
                                    }
                                }
                            }
                            
                            const isHovered = hoveredCountryCode === countryCode && hoveredCountryCode !== null;
                            
                            const pathData = pathGenerator.current!(feature);
                            
                            if (!pathData || !countryCode) return null;
                            
                            return (
                                <path
                                    key={countryCode}
                                    d={pathData}
                                    fill={getFillColor(countryCode, isHovered)}
                                    stroke={isHovered ? '#4A9EFF' : '#1A73E8'}
                                    strokeWidth={isHovered ? '1.5' : '0.5'}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        shapeRendering: 'geometricPrecision',
                                        filter: isHovered ? 'drop-shadow(0 0 12px rgba(26, 115, 232, 0.8))' : 'none',
                                        pointerEvents: 'all',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        if (countryCode) {
                                            handleCountryMouseEnter(e, countryName, count, countryCode);
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.stopPropagation();
                                        handleCountryMouseLeave();
                                    }}
                                />
                            );
                        })}
                    </g>
                </svg>

                {/* Tooltip - rendered via portal to avoid transform issues */}
                {mounted && hoveredCountry && createPortal(
                    <motion.div
                        style={{
                            position: 'fixed',
                            left: smoothX,
                            top: smoothY,
                            pointerEvents: 'none',
                            zIndex: 9999,
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1,
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                            duration: 0.15,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        <div className={styles.tooltipContent}>
                            <div className={styles.tooltipCountry}>{hoveredCountry.name}</div>
                            <div className={styles.tooltipCount}>
                                {hoveredCountry.count > 0 ? `${hoveredCountry.count.toLocaleString()} requests` : '0 requests'}
                            </div>
                        </div>
                    </motion.div>,
                    document.body
                )}
            </div>
    );
}
