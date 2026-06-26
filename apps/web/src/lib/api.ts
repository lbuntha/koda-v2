import type {
    AdminUserListItem,
    AuthTokens,
    ChildProfile,
    ChildProfileUpdate,
    ChildProfileSession,
    FeaturesSettings,
    LearningCatalogSettings,
    MenuItem,
    MenusSettings,
    OnboardingChildCreate,
    ParentOnboardingState,
    ParentProfile,
    ParentProfileUpdate,
    PlacementQuestion,
    PlacementSession,
    RegisterRequest,
    RolesSettings,
    UploadedAsset,
    UserPublic,
    XpSettings,
} from '@koda/contracts';
import type { ChildTotal, LessonResult, LessonSkill, SubmittedAnswer } from '@/features/lessons/types';

interface SkillSummary {
    id: string;
    slug: string;
    title: string;
    description: string;
    grade: string;
    locale: string;
    status: string;
    tags: string[];
    question_count: number;
}

interface ChildProfileResponse {
    _id: string;
    parent_user_id: string;
    display_name: string;
    avatar_url?: string | null;
    avatar_svg?: string | null;
    grade: string | null;
    age_range_id?: string | null;
    subject_ids: string[];
    primary_subject_id?: string | null;
    placement_status: 'not_started' | 'in_progress' | 'complete';
    placement_result_summary?: Record<string, unknown> | null;
    locale: string;
    active_skill_ids: string[];
    disabled_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface LessonSubmitPayload {
    client_attempt_id: string;
    child_profile_id: string;
    skill_id: string;
    answers: SubmittedAnswer[];
    started_at: string;
    completed_at: string;
}

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

export function getStoredRefreshToken() {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
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

export async function refreshSession() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }
    const tokens = await request<AuthTokens>(
        '/auth/refresh',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        },
        { skipAuthRefresh: true },
    );
    storeTokens(tokens);
    return tokens;
}

export async function getMe(token: string) {
    return request<UserPublic>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function listAdminUsers(token: string) {
    return request<AdminUserListItem[]>('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getRoleSettings(token: string) {
    return request<RolesSettings>('/admin/settings/roles', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateRoleSettings(token: string, payload: RolesSettings) {
    return request<RolesSettings>('/admin/settings/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function getMenuSettings(token: string) {
    return request<MenusSettings>('/admin/settings/menus', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateMenuSettings(token: string, payload: MenusSettings) {
    return request<MenusSettings>('/admin/settings/menus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function createMenuItem(token: string, item: MenuItem) {
    return request<MenuItem>('/admin/settings/menus/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(item),
    });
}

export async function updateMenuItem(token: string, item: MenuItem) {
    return request<MenuItem>(`/admin/settings/menus/items/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(item),
    });
}

export async function deleteMenuItem(token: string, itemId: string) {
    await request<void>(`/admin/settings/menus/items/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function reseedSettings(token: string, key?: string) {
    const qs = key ? `?key=${encodeURIComponent(key)}` : '';
    return request<{ reset: string[] }>(`/admin/settings/reseed${qs}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getFeatureSettings(token: string) {
    return request<FeaturesSettings>('/admin/settings/features', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateFeatureSettings(token: string, payload: FeaturesSettings) {
    return request<FeaturesSettings>('/admin/settings/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function getXpSettings(token: string) {
    return request<XpSettings>('/admin/settings/xp', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateXpSettings(token: string, payload: XpSettings) {
    return request<XpSettings>('/admin/settings/xp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function getLearningCatalog(token: string) {
    return request<LearningCatalogSettings>('/admin/settings/learning-catalog', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateLearningCatalog(token: string, payload: LearningCatalogSettings) {
    return request<LearningCatalogSettings>('/admin/settings/learning-catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function listChildren(token: string) {
    return request<ChildProfileResponse[]>('/me/children', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function createChild(token: string, body: { display_name: string; grade?: string | null; locale?: string }) {
    return request<ChildProfileResponse>('/me/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

export async function getParentOnboarding(token: string) {
    return request<ParentOnboardingState>('/parent/onboarding', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getParentProfile(token: string) {
    return request<ParentProfile>('/parent/profile', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function updateParentProfile(token: string, body: ParentProfileUpdate) {
    return request<ParentProfile>('/parent/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

export async function uploadParentAvatar(token: string, file: File) {
    const body = new FormData();
    body.set('file', file);
    return request<UploadedAsset>('/uploads/parent-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
    });
}

export async function getKidProfile(childToken: string) {
    return request<ChildProfile>(
        '/kid/profile',
        {
            headers: { Authorization: `Bearer ${childToken}` },
        },
        { skipAuthRefresh: true },
    );
}

export async function updateKidProfile(childToken: string, body: ChildProfileUpdate) {
    return request<ChildProfile>(
        '/kid/profile',
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${childToken}` },
            body: JSON.stringify(body),
        },
        { skipAuthRefresh: true },
    );
}

export async function uploadChildAvatar(childToken: string, file: File) {
    const body = new FormData();
    body.set('file', file);
    return request<UploadedAsset>(
        '/uploads/child-avatar',
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${childToken}` },
            body,
        },
        { skipAuthRefresh: true },
    );
}

export async function createOnboardingChild(token: string, body: OnboardingChildCreate) {
    return request<ChildProfile>('/parent/onboarding/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

export async function updateOnboardingChild(token: string, childId: string, body: Partial<OnboardingChildCreate>) {
    return request<ChildProfile>(`/parent/onboarding/children/${encodeURIComponent(childId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

export async function loginChildProfile(token: string, childId: string) {
    return request<ChildProfileSession>(`/parent/children/${encodeURIComponent(childId)}/login`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function disableChildProfile(token: string, childId: string) {
    return request<ChildProfile>(`/parent/children/${encodeURIComponent(childId)}/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function enableChildProfile(token: string, childId: string) {
    return request<ChildProfile>(`/parent/children/${encodeURIComponent(childId)}/enable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function deleteChildProfile(token: string, childId: string) {
    await request<void>(`/parent/children/${encodeURIComponent(childId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function createKidPlacementSession(childToken: string) {
    return request<PlacementSession>(
        '/kid/placement/sessions',
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${childToken}` },
        },
        { skipAuthRefresh: true },
    );
}

export async function getNextKidPlacementQuestion(childToken: string, sessionId: string) {
    return request<PlacementQuestion | null>(
        `/kid/placement/sessions/${encodeURIComponent(sessionId)}/next-question`,
        {
            headers: { Authorization: `Bearer ${childToken}` },
        },
        { skipAuthRefresh: true },
    );
}

export async function answerKidPlacementQuestion(
    childToken: string,
    sessionId: string,
    body: { question_id: string; selected_value: string | number },
) {
    return request<PlacementSession>(
        `/kid/placement/sessions/${encodeURIComponent(sessionId)}/answers`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${childToken}` },
            body: JSON.stringify(body),
        },
        { skipAuthRefresh: true },
    );
}

export async function completeKidPlacementSession(childToken: string, sessionId: string) {
    return request<PlacementSession>(
        `/kid/placement/sessions/${encodeURIComponent(sessionId)}/complete`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${childToken}` },
        },
        { skipAuthRefresh: true },
    );
}

export async function createPlacementSession(token: string, body: { child_profile_id: string; subject_id?: string | null }) {
    return request<PlacementSession>('/placement/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

export async function getPlacementSession(token: string, sessionId: string) {
    return request<PlacementSession>(`/placement/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getNextPlacementQuestion(token: string, sessionId: string) {
    return request<PlacementQuestion | null>(`/placement/sessions/${encodeURIComponent(sessionId)}/next-question`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function answerPlacementQuestion(
    token: string,
    sessionId: string,
    body: { question_id: string; selected_value: string | number },
) {
    return request<PlacementSession>(`/placement/sessions/${encodeURIComponent(sessionId)}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
}

export async function completePlacementSession(token: string, sessionId: string) {
    return request<PlacementSession>(`/placement/sessions/${encodeURIComponent(sessionId)}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function listSkills(token: string, params: { grade?: string; locale?: string; status?: string } = {}) {
    const search = new URLSearchParams();
    if (params.grade) search.set('grade', params.grade);
    if (params.locale) search.set('locale', params.locale);
    if (params.status) search.set('status', params.status);
    const qs = search.toString();
    return request<SkillSummary[]>(`/skills${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getSkill(token: string, skillId: string) {
    return request<LessonSkill>(`/skills/${encodeURIComponent(skillId)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function submitLesson(token: string, payload: LessonSubmitPayload) {
    return request<LessonResult>('/lessons/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
}

export async function getMyChildTotals(token: string) {
    return request<{ children: ChildTotal[] }>('/lessons/me/totals', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export type { SkillSummary, ChildProfileResponse };

interface RequestOptions {
    skipAuthRefresh?: boolean;
}

let refreshPromise: Promise<AuthTokens> | null = null;

async function request<T>(path: string, init?: RequestInit, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, withCurrentAccessToken(init));
    if (response.status === 401 && !options.skipAuthRefresh && hasAuthorization(init)) {
        try {
            const tokens = await refreshStoredSession();
            const retryInit = withAuthorization(init, tokens.access_token);
            const retryResponse = await fetch(`${API_URL}${path}`, retryInit);
            return parseResponse<T>(retryResponse);
        } catch (err) {
            clearTokens();
            throw err;
        }
    }
    return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
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
    if (response.status === 204) {
        return undefined as T;
    }
    return response.json() as Promise<T>;
}

function hasAuthorization(init?: RequestInit) {
    const headers = new Headers(init?.headers);
    return headers.has('Authorization');
}

function withCurrentAccessToken(init?: RequestInit) {
    if (!hasAuthorization(init)) return init;
    const headers = new Headers(init?.headers);
    if (headers.get('Authorization')) return init;
    const token = getStoredToken();
    if (!token) return init;
    return withAuthorization(init, token);
}

function withAuthorization(init: RequestInit | undefined, token: string): RequestInit {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return { ...init, headers };
}

function refreshStoredSession() {
    refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
    });
    return refreshPromise;
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
