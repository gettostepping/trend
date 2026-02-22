"use client";

import * as React from "react";
import { ContextMenu as PrimeContextMenu } from 'primereact/contextmenu';
import { type LucideIcon } from "lucide-react";
import './ContextMenu.module.css';

interface MenuItem {
    id: string | number;
    label: string;
    icon: LucideIcon;
}

interface ContextMenuProps {
    menuItems: MenuItem[];
    onSelect: (item: MenuItem) => void;
    children: React.ReactNode;
    id?: string;
}

export function ContextMenu({ menuItems, onSelect, children, id }: ContextMenuProps) {
    const cmRef = React.useRef<PrimeContextMenu>(null);
    const menuId = React.useId();

    // Convert menuItems to PrimeReact format
    const primeModel = React.useMemo(() => {
        return menuItems.map((originalItem) => {
            const Icon = originalItem.icon;
            return {
                label: originalItem.label,
                icon: () => <Icon size={16} />,
                command: () => onSelect(originalItem),
            };
        });
    }, [menuItems, onSelect]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Show this menu - PrimeReact should handle multiple instances independently
        cmRef.current?.show(e);
    };

    return (
        <>
            <div onContextMenu={handleContextMenu}>
                {children}
            </div>
            <PrimeContextMenu 
                ref={cmRef} 
                model={primeModel}
                className="dark-context-menu"
                id={id || menuId}
            />
        </>
    );
}
