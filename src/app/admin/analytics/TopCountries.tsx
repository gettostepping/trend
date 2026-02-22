'use client';

import { motion } from 'framer-motion';
import * as Flags from 'country-flag-icons/react/3x2';
import styles from './geographic.module.css';

interface CountryData {
    country: string;
    count: number;
}

interface TopCountriesProps {
    countries: CountryData[];
    total: number;
}

// Country name to ISO 3166-1-alpha-2 code mapping for flag-icons
const countryToISO: Record<string, string> = {
    'United States': 'us',
    'India': 'in',
    'United Kingdom': 'gb',
    'Indonesia': 'id',
    'Germany': 'de',
    'Canada': 'ca',
    'Australia': 'au',
    'France': 'fr',
    'Brazil': 'br',
    'Mexico': 'mx',
    'Japan': 'jp',
    'South Korea': 'kr',
    'China': 'cn',
    'Spain': 'es',
    'Italy': 'it',
    'Netherlands': 'nl',
    'Sweden': 'se',
    'Norway': 'no',
    'Poland': 'pl',
    'Thailand': 'th',
    'Vietnam': 'vn',
    'Philippines': 'ph',
    'Malaysia': 'my',
    'Singapore': 'sg',
    'South Africa': 'za',
    'Argentina': 'ar',
    'Chile': 'cl',
    'Colombia': 'co',
    'Peru': 'pe',
    'New Zealand': 'nz',
};

export default function TopCountries({ countries, total }: TopCountriesProps) {
    // Filter out "Unknown" and get top 5
    const top5 = countries.filter(c => c.country !== 'Unknown' && c.country !== 'unknown').slice(0, 5);

    return (
        <div className={styles.topCountriesPanel}>
            <div className={styles.topCountriesHeader}>
                <div className={styles.topCountriesTitle}>
                    <span className={styles.globeIcon}>🌍</span>
                    <span>TOP COUNTRIES</span>
                </div>
            </div>
            <div className={styles.topCountriesList}>
                {top5.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No country data available</p>
                    </div>
                ) : (
                    top5.map((country, index) => {
                        const isoCode = countryToISO[country.country]?.toUpperCase() || 'XX';
                        const isTop = index === 0;
                        // Get the flag component dynamically
                        const FlagComponent = Flags[isoCode as keyof typeof Flags] as React.ComponentType<React.SVGProps<SVGSVGElement>> | undefined;

                        return (
                            <motion.div
                                key={country.country}
                                className={`${styles.countryItem} ${isTop ? styles.topCountry : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className={styles.countryFlag}>
                                    {FlagComponent ? (
                                        <FlagComponent className={styles.flagSvg} />
                                    ) : (
                                        <span className={styles.flagPlaceholder}>🌐</span>
                                    )}
                                </div>
                                <div className={styles.countryInfo}>
                                    <div className={styles.countryName}>{country.country}</div>
                                    <div className={styles.countryCount}>{country.count.toLocaleString()}</div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
            <div className={styles.totalCount}>
                <div className={styles.totalLabel}>TOTAL</div>
                <div className={styles.totalValue}>{total.toLocaleString()}</div>
            </div>
        </div>
    );
}
