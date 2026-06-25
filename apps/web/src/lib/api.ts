import type { AuthTokens, RegisterRequest, RolesSettings, UserPublic } from '@koda/contracts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'koda.accessToken';
const REFRESH_TOKEN_KEY = 'koda.refreshToken';

export interface Health {
    status: string;
    mongo: boolean;
    version: string;
}

export interface ApiError {
    detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>;
}

export function getStoredToken() {
    return window.localStorage.getItem(TOKEN_KEY);
}

export function storeTokens(tokens: AuthTokens) {
    window.localStorage.setItem(TOKEN_KEY, tokens.access_token);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function getHealth() {
    return request<Health>('/health');
}

export async function register(payload: RegisterRequest) {
    return request<AuthTokens>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function login(email: string, password: string) {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return request<AuthTokens>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
}

export async function getMe(token: string) {
    return request<UserPublic>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getRoleSettings(token: string) {
    return request<RolesSettings>('/admin/settings/roles', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, init);
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const payload = (await response.json()) as ApiError;
            if (payload.detail) {
                message = formatApiDetail(payload.detail);
            }
        } catch {
            // Keep the status-based fallback.
        }
        throw new Error(message);
    }
    return response.json() as Promise<T>;
}

function formatApiDetail(detail: ApiError['detail']) {
    if (typeof detail === 'string') {
        return detail;
    }
    if (Array.isArray(detail)) {
        return detail
            .map(item => {
                const field = item.loc?.[item.loc.length - 1];
                return field ? `${field}: ${item.msg ?? 'Invalid value'}` : item.msg ?? 'Invalid value';
            })
            .join(', ');
    }
    return 'Request failed';
}
