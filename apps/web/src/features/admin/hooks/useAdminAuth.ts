import { useEffect, useState } from 'react';
import type { Role, UserPublic } from '@koda/contracts';
import { clearTokens, getMe, getStoredToken } from '@/lib/api';

export type AdminAuthState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'authenticated'; user: UserPublic; token: string };

export function isAdminRole(role: Role) {
    return role === 'admin' || role === 'superadmin';
}

export function isSuperadmin(role: Role) {
    return role === 'superadmin';
}

export function useAdminAuth(): AdminAuthState {
    const [state, setState] = useState<AdminAuthState>({ status: 'loading' });

    useEffect(() => {
        const token = getStoredToken();
        if (!token) {
            setState({ status: 'unauthenticated' });
            return;
        }
        getMe(token)
            .then(user => setState({ status: 'authenticated', user, token }))
            .catch(() => {
                clearTokens();
                setState({ status: 'unauthenticated' });
            });
    }, []);

    return state;
}
