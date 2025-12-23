'use server';

import { cookies } from 'next/headers';

const RECENT_CLIENTS_COOKIE = 'recruiter_recent_clients';
const MAX_RECENT_CLIENTS = 5;

export async function trackRecentClient(clientId: string) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(RECENT_CLIENTS_COOKIE);

    let recentClients: string[] = [];

    if (cookie?.value) {
        try {
            recentClients = JSON.parse(cookie.value);
        } catch {
            // Invalid cookie value, start fresh
            recentClients = [];
        }
    }

    // Remove if exists (to bring to top)
    recentClients = recentClients.filter(id => id !== clientId);

    // Add to front
    recentClients.unshift(clientId);

    // Limit to max
    recentClients = recentClients.slice(0, MAX_RECENT_CLIENTS);

    // Save with 30 day expiry
    cookieStore.set(RECENT_CLIENTS_COOKIE, JSON.stringify(recentClients), {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
}

export async function getRecentClientIds(): Promise<string[]> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(RECENT_CLIENTS_COOKIE);

    if (!cookie?.value) return [];

    try {
        const ids = JSON.parse(cookie.value);
        if (Array.isArray(ids)) return ids;
    } catch {
        return [];
    }
    return [];
}
