'use client';

import { useEffect } from 'react';
import { trackRecentClient } from '@/app/actions/navigation';

export function RecentClientTracker({ clientId }: { clientId: string }) {
    useEffect(() => {
        // optimistically fire and forget
        trackRecentClient(clientId);
    }, [clientId]);

    return null;
}
