'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface ActionCardProps {
    icon: IconDefinition;
    title: string;
    description: string;
    href: string;
}

export default function ActionCard({ icon, title, description, href }: ActionCardProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(href);
    };

    return (
        <a href={href} onClick={handleClick} className={styles.actionCard}>
            <div className={styles.actionIcon}>
                <FontAwesomeIcon icon={icon} />
            </div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDescription}>{description}</p>
        </a>
    );
}
