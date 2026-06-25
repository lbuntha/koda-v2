import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedMode = 'light' | 'dark';

interface ThemeContextValue {
    mode: ThemeMode;
    resolvedMode: ResolvedMode;
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
}

const STORAGE_KEY = 'koda.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
    if (typeof window === 'undefined') return 'system';
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

function systemPrefersDark(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(mode: ThemeMode): ResolvedMode {
    if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
    return mode;
}

function applyResolved(resolved: ResolvedMode) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
    const [resolvedMode, setResolvedMode] = useState<ResolvedMode>(() => resolve(readStoredMode()));

    useEffect(() => {
        applyResolved(resolvedMode);
    }, [resolvedMode]);

    useEffect(() => {
        if (mode !== 'system' || typeof window === 'undefined') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => setResolvedMode(media.matches ? 'dark' : 'light');
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [mode]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
        setResolvedMode(resolve(next));
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, next);
        }
    }, []);

    const toggle = useCallback(() => {
        setMode(resolvedMode === 'dark' ? 'light' : 'dark');
    }, [resolvedMode, setMode]);

    const value = useMemo<ThemeContextValue>(
        () => ({ mode, resolvedMode, setMode, toggle }),
        [mode, resolvedMode, setMode, toggle],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used inside <ThemeProvider>');
    }
    return ctx;
}
