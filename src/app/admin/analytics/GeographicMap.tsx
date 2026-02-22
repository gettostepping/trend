'use client';

import { useState, useCallback, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { CursorProvider, CursorFollow } from '@/components/animate-ui/components/animate/cursor';
import styles from './geographic.module.css';

// World map topology URL
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface CountryData {
    country: string;
    count: number;
}

interface GeographicMapProps {
    countryData: CountryData[];
}

// Country name mapping (ISO 3166-1 alpha-2 to full name)
const countryNameMap: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'GR': 'Greece',
    'RU': 'Russia',
    'CN': 'China',
    'JP': 'Japan',
    'KR': 'South Korea',
    'IN': 'India',
    'ID': 'Indonesia',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'NZ': 'New Zealand',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'IL': 'Israel',
    'TR': 'Turkey',
};

// Reverse mapping: full name to ISO code
const reverseCountryMap: Record<string, string> = {};
Object.entries(countryNameMap).forEach(([code, name]) => {
    reverseCountryMap[name] = code;
});

function getCountryCode(countryName: string): string | null {
    // Try direct lookup
    if (reverseCountryMap[countryName]) {
        return reverseCountryMap[countryName];
    }
    
    // Try case-insensitive lookup
    const lowerName = countryName.toLowerCase();
    for (const [code, name] of Object.entries(countryNameMap)) {
        if (name.toLowerCase() === lowerName) {
            return code;
        }
    }
    
    return null;
}

export default function GeographicMap({ countryData }: GeographicMapProps) {
    const [hoveredCountry, setHoveredCountry] = useState<{
        name: string;
        count: number;
    } | null>(null);

    // Create a map of country codes to counts
    const countryCountMap = useMemo(() => {
        const map = new Map<string, number>();
        countryData.forEach(({ country, count }) => {
            const code = getCountryCode(country);
            if (code) {
                map.set(code, count);
            }
        });
        return map;
    }, [countryData]);

    // Get max count for color intensity
    const maxCount = useMemo(() => {
        return Math.max(...Array.from(countryCountMap.values()), 1);
    }, [countryCountMap]);

    const handleGeographyHover = useCallback((geo: any, e: React.MouseEvent) => {
        const countryCode = geo.properties.ISO_A2;
        const count = countryCountMap.get(countryCode) || 0;
        const countryName = countryNameMap[countryCode] || geo.properties.NAME || 'Unknown';
        
        if (count > 0) {
            setHoveredCountry({
                name: countryName,
                count,
            });
        }
    }, [countryCountMap]);

    const handleGeographyLeave = useCallback(() => {
        setHoveredCountry(null);
    }, []);

    const getFillColor = (countryCode: string) => {
        const count = countryCountMap.get(countryCode) || 0;
        if (count === 0) return '#2a2a2a';
        
        // Calculate intensity (0 to 1)
        const intensity = count / maxCount;
        
        // Blue gradient: darker blue for more traffic
        const r = Math.floor(26 + (intensity * 50)); // 26-76
        const g = Math.floor(115 + (intensity * 100)); // 115-215
        const b = Math.floor(232 - (intensity * 50)); // 232-182
        
        return `rgb(${r}, ${g}, ${b})`;
    };

    return (
        <CursorProvider global={false}>
            <div className={styles.mapContainer}>
                <TransformWrapper
                    initialScale={1}
                    minScale={0.2}
                    maxScale={6}
                    wheel={{ step: 0.1 }}
                    doubleClick={{ disabled: false }}
                    limitToBounds={false}
                    panning={{ disabled: false }}
                >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className={styles.mapControls}>
                            <button onClick={() => zoomIn()} className={styles.controlBtn}>
                                +
                            </button>
                            <button onClick={() => zoomOut()} className={styles.controlBtn}>
                                −
                            </button>
                            <button onClick={() => resetTransform()} className={styles.controlBtn}>
                                <FontAwesomeIcon icon={faGlobe} />
                            </button>
                        </div>
                        <TransformComponent
                            wrapperClass={styles.transformWrapper}
                            contentClass={styles.transformContent}
                        >
                            <div className={styles.mapWrapper}>
                                <ComposableMap
                                    projectionConfig={{
                                        scale: 300,
                                        center: [0, 0],
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <Geographies geography={geoUrl}>
                                        {({ geographies }) =>
                                            geographies.map((geo) => {
                                                const countryCode = geo.properties.ISO_A2;
                                                return (
                                                    <Geography
                                                        key={geo.rsmKey}
                                                        geography={geo}
                                                        fill={getFillColor(countryCode)}
                                                        stroke="#1A73E8"
                                                        strokeWidth={0.5}
                                                        style={{
                                                            default: {
                                                                outline: 'none',
                                                                cursor: countryCountMap.get(countryCode) ? 'pointer' : 'default',
                                                            },
                                                            hover: {
                                                                outline: 'none',
                                                                fill: countryCountMap.get(countryCode) 
                                                                    ? '#1A73E8' 
                                                                    : '#2a2a2a',
                                                                transition: 'all 0.2s ease',
                                                            },
                                                        }}
                                                        onMouseEnter={(e) => handleGeographyHover(geo, e)}
                                                        onMouseLeave={handleGeographyLeave}
                                                    />
                                                );
                                            })
                                        }
                                    </Geographies>
                                </ComposableMap>
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

                {/* Cursor-following tooltip */}
                {hoveredCountry && (
                    <CursorFollow
                        sideOffset={20}
                        alignOffset={0}
                        transition={{ stiffness: 500, damping: 50, bounce: 0 }}
                        className={styles.cursorFollow}
                    >
                        <div className={styles.tooltipContent}>
                            <div className={styles.tooltipCountry}>{hoveredCountry.name}</div>
                            <div className={styles.tooltipCount}>
                                {hoveredCountry.count.toLocaleString()} requests
                            </div>
                        </div>
                    </CursorFollow>
                )}
            </div>
        </CursorProvider>
    );
}
