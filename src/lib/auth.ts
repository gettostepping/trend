import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
    return hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
    return compare(password, hashed);
}

export function generateAuthCode(): string {
    // Generate a random 6-character alphanumeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
