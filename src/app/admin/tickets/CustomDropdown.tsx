'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from './customDropdown.module.css';

interface DropdownOption {
    value: string;
    label: string;
    icon?: any;
}

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    placeholder?: string;
    className?: string;
}

export default function CustomDropdown({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    className = '',
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Calculate menu position
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                });
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const menuContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={styles.dropdownMenu}
                    style={{
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        width: `${menuPosition.width}px`,
                    }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`${styles.dropdownItem} ${value === option.value ? styles.dropdownItemActive : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.icon && (
                                <FontAwesomeIcon icon={option.icon} className={styles.optionIcon} />
                            )}
                            {option.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
                <button
                    ref={buttonRef}
                    type="button"
                    className={styles.dropdownButton}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={styles.dropdownValue}>
                        {selectedOption ? (
                            <>
                                {selectedOption.icon && (
                                    <FontAwesomeIcon icon={selectedOption.icon} className={styles.optionIcon} />
                                )}
                                {selectedOption.label}
                            </>
                        ) : (
                            <span className={styles.placeholder}>{placeholder}</span>
                        )}
                    </span>
                    <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    />
                </button>
            </div>
            {typeof window !== 'undefined' && createPortal(menuContent, document.body)}
        </>
    );
}
