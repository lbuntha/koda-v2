import { Check, Search, Shuffle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { Tabs, type TabItem } from './Tabs';

const DICEBEAR_BASE_URL = 'https://api.dicebear.com/10.x';

const AVATAR_STYLES = [
    { value: 'shapes', label: 'Triangles' },
    { value: 'fun-emoji', label: 'Fun Emoji' },
    { value: 'glass', label: 'Glass' },
    { value: 'thumbs', label: 'Thumbs' },
    { value: 'adventurer-neutral', label: 'Adventurer' },
    { value: 'lorelei', label: 'Lorelei' },
    { value: 'notionists-neutral', label: 'Notion' },
    { value: 'pixel-art', label: 'Pixel' },
    { value: 'bottts-neutral', label: 'Robots' },
    { value: 'personas', label: 'Personas' },
] as const;

type AvatarStyle = (typeof AVATAR_STYLES)[number]['value'];

const DEFAULT_AVATAR_SEEDS = [
    'Aaliyah', 'Abby', 'Adrian', 'Alex', 'Amaya', 'Anika', 'Aria', 'Avery',
    'Bopha', 'Borey', 'Caleb', 'Camila', 'Chan', 'Dara', 'Davi', 'Dona',
    'Eli', 'Emma', 'Hana', 'Heng', 'Ivy', 'Jaden', 'Kai', 'Kanha',
    'Lina', 'Luca', 'Maya', 'Mina', 'Nika', 'Noah', 'Nora', 'Oudom',
    'Pharidette', 'Rina', 'Sela', 'Sokha', 'Sopheak', 'Tara', 'Theo', 'Vanna',
];

const svgCache = new Map<string, string>();

export interface AvatarSelection {
    seed: string;
    style: AvatarStyle;
    svg: string;
    url: string;
}

export function diceBearAvatarUrl(style: AvatarStyle, seed: string) {
    const cleanSeed = seed.trim() || 'Koda';
    return `${DICEBEAR_BASE_URL}/${style}/svg?seed=${encodeURIComponent(cleanSeed)}`;
}

export function diceBearAdventurerNeutralUrl(seed: string) {
    return diceBearAvatarUrl('adventurer-neutral', seed);
}

export function AvatarCollectionPicker({
    label = 'Avatar',
    onChange,
    onError,
    seedHints = [],
    value,
}: {
    label?: string;
    onChange: (selection: AvatarSelection) => void;
    onError?: (message: string) => void;
    seedHints?: string[];
    value?: string | null;
}) {
    const [style, setStyle] = useState<AvatarStyle>('shapes');
    const [query, setQuery] = useState('');
    const [loadingSeed, setLoadingSeed] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(8);
    const styleTabs = useMemo<TabItem<AvatarStyle>[]>(
        () => AVATAR_STYLES.map(item => ({ value: item.value, label: item.label })),
        [],
    );
    const seeds = useMemo(() => {
        const merged = [...seedHints, ...DEFAULT_AVATAR_SEEDS]
            .map(seed => seed.trim())
            .filter(Boolean);
        return Array.from(new Set(merged));
    }, [seedHints]);
    const visibleSeeds = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        const matchingSeeds = normalized ? seeds.filter(seed => seed.toLowerCase().includes(normalized)) : seeds;
        return matchingSeeds.slice(0, visibleCount);
    }, [query, seeds, visibleCount]);

    useEffect(() => {
        function syncVisibleCount() {
            const width = window.innerWidth;
            if (width >= 640) {
                setVisibleCount(12);
            } else {
                setVisibleCount(8);
            }
        }
        syncVisibleCount();
        window.addEventListener('resize', syncVisibleCount);
        return () => window.removeEventListener('resize', syncVisibleCount);
    }, []);

    async function selectSeed(seed: string) {
        const url = diceBearAvatarUrl(style, seed);
        setLoadingSeed(seed);
        try {
            const svg = await fetchAvatarSvg(url);
            onChange({ seed, style, svg, url });
        } catch (err) {
            onError?.(err instanceof Error ? err.message : 'Unable to load avatar');
        } finally {
            setLoadingSeed(null);
        }
    }

    function randomize() {
        const seed = seeds[Math.floor(Math.random() * seeds.length)] ?? 'Koda';
        void selectSeed(`${seed}-${Date.now().toString(36).slice(-4)}`);
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">{label}</p>
                </div>
                <Button
                    leftIcon={<Shuffle className="h-4 w-4" />}
                    loading={Boolean(loadingSeed)}
                    size="sm"
                    variant="outline"
                    onClick={randomize}
                >
                    Random
                </Button>
            </div>

            <div className="mt-3">
                <Tabs
                    ariaLabel="Avatar category"
                    className="w-full"
                    items={styleTabs}
                    value={style}
                    onChange={setStyle}
                />
            </div>

            <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D89AE] dark:text-slate-500" />
                <input
                    className="min-h-10 w-full rounded-xl border border-[#DCD7EA] bg-white pl-9 pr-3 text-sm font-medium text-[#0E0B55] outline-none transition placeholder:text-[#A7A2B8] focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:focus:ring-slate-800"
                    placeholder="Search avatar by name"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {visibleSeeds.map(seed => {
                    const url = diceBearAvatarUrl(style, seed);
                    const selected = value === url;
                    return (
                        <button
                            key={seed}
                            disabled={Boolean(loadingSeed)}
                            className={`relative grid aspect-square place-items-center rounded-xl border transition ${
                                selected
                                    ? 'border-[#534AB7] bg-[#F2EEFF] ring-2 ring-[#BDB4F4] dark:border-brand-300 dark:bg-brand-400/15 dark:ring-brand-400/30'
                                    : 'border-[#E7E2F6] bg-white hover:border-[#BDB4F4] hover:bg-[#FBFAFF] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-brand-400 dark:hover:bg-slate-900'
                            }`}
                            title={seed}
                            type="button"
                            onClick={() => void selectSeed(seed)}
                        >
                            <img
                                alt={seed}
                                className={`h-11 w-11 rounded-full sm:h-12 sm:w-12 ${loadingSeed === seed ? 'opacity-40' : ''}`}
                                loading="lazy"
                                src={url}
                            />
                            {loadingSeed === seed && (
                                <span className="absolute inset-2 animate-pulse rounded-2xl bg-[#F2EEFF]/80 dark:bg-slate-800/80" />
                            )}
                            {selected && (
                                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#534AB7] text-white dark:bg-brand-400 dark:text-slate-950">
                                    <Check className="h-3.5 w-3.5" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

async function fetchAvatarSvg(url: string) {
    const cached = svgCache.get(url);
    if (cached) return cached;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Unable to load avatar. Please try another one.');
    }
    const svg = await response.text();
    if (!svg.trim().startsWith('<svg')) {
        throw new Error('Avatar service returned an invalid image.');
    }
    svgCache.set(url, svg);
    return svg;
}
