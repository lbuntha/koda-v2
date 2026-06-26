export type Role = 'student' | 'parent' | 'teacher' | 'admin';

export type SkillStatus = 'draft' | 'published' | 'archived';

export type AttemptStatus = 'started' | 'completed' | 'abandoned';

export interface User {
    _id: string;
    email: string;
    display_name: string;
    role: Role;
    locale: string;
    created_at: string;
    updated_at: string;
    disabled_at?: string | null;
}

export interface UserPublic {
    _id: string;
    email: string;
    display_name: string;
    role: Role;
    locale: string;
}

export interface AdminUserListItem extends UserPublic {
    created_at: string;
    updated_at: string;
    disabled_at?: string | null;
    children?: ChildProfile[];
}

export interface RegisterRequest {
    email: string;
    password: string;
    display_name: string;
    locale?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: 'bearer';
    user: UserPublic;
}

export interface RolePermission {
    key: string;
    label: string;
    description: string;
}

export interface RoleRights {
    role: Role;
    label: string;
    permissions: string[];
    menu_items: string[];
}

export interface RolesSettings {
    permissions: RolePermission[];
    roles: RoleRights[];
}

export type MenuSection = 'top' | 'manage';
export type MenuScope = Role | 'all';

export interface MenuItem {
    id: string;
    label_key: string;
    route: string;
    icon: string;
    section: MenuSection;
    scope: MenuScope;
    permission?: string | null;
    end?: boolean;
    order: number;
    enabled: boolean;
}

export interface RouteEntry {
    route: string;
    scopes: MenuScope[];
}

export interface MenusSettings {
    items: MenuItem[];
}

export const ROUTE_REGISTRY: readonly RouteEntry[] = [
    { route: '/admin',                scopes: ['admin'] },
    { route: '/admin/roles',          scopes: ['admin'] },
    { route: '/admin/features',       scopes: ['admin'] },
    { route: '/admin/settings',       scopes: ['admin'] },
    { route: '/admin/system-status',  scopes: ['admin'] },
    { route: '/admin/menus',          scopes: ['admin'] },
    { route: '/admin/subjects',       scopes: ['admin'] },
    { route: '/admin/skills',         scopes: ['admin'] },
    { route: '/admin/users',          scopes: ['admin'] },
    { route: '/admin/audit',          scopes: ['admin'] },
    { route: '/teacher',              scopes: ['teacher'] },
    { route: '/teacher/skills',       scopes: ['teacher'] },
    { route: '/teacher/students',     scopes: ['teacher'] },
    { route: '/teacher/reports',      scopes: ['teacher'] },
    { route: '/teacher/classes',      scopes: ['teacher'] },
    { route: '/teacher/settings',     scopes: ['teacher'] },
    { route: '/parent',               scopes: ['parent'] },
    { route: '/parent/children',      scopes: ['parent'] },
    { route: '/parent/progress',      scopes: ['parent'] },
    { route: '/parent/settings',      scopes: ['parent'] },
    { route: '/student',              scopes: ['student'] },
    { route: '/student/progress',     scopes: ['student'] },
    { route: '/student/rewards',      scopes: ['student'] },
] as const;

export const ICON_REGISTRY = [
    'LayoutDashboard', 'ShieldCheck', 'ToggleLeft', 'Settings', 'Activity',
    'Menu', 'BookOpen', 'Users', 'ScrollText', 'GraduationCap', 'BarChart3',
    'School', 'Baby', 'TrendingUp', 'Trophy',
] as const;
export type IconName = (typeof ICON_REGISTRY)[number];

export interface ChildProfile {
    _id: string;
    parent_user_id: string;
    display_name: string;
    avatar_url?: string | null;
    avatar_svg?: string | null;
    grade?: string | null;
    age_range_id?: string | null;
    subject_ids: string[];
    primary_subject_id?: string | null;
    placement_status: 'not_started' | 'in_progress' | 'complete';
    placement_result_summary?: PlacementResultSummary | null;
    locale: string;
    active_skill_ids: string[];
    disabled_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChildProfileUpdate {
    display_name?: string;
    avatar_url?: string | null;
    avatar_svg?: string | null;
    locale?: string;
}

export interface OnboardingChildCreate {
    display_name: string;
    age_range_id: string;
    subject_ids: string[];
    primary_subject_id: string;
    locale?: string;
    grade?: string | null;
}

export interface ParentOnboardingState {
    catalog: LearningCatalogSettings;
    children: ChildProfile[];
}

export interface ParentNotificationPreferences {
    placement_complete: boolean;
    weekly_summary: boolean;
    learning_reminders: boolean;
    product_updates: boolean;
}

export interface ParentProfile {
    _id: string;
    email: string;
    display_name: string;
    locale: string;
    avatar_url?: string | null;
    avatar_svg?: string | null;
    phone?: string | null;
    timezone: string;
    notification_preferences: ParentNotificationPreferences;
    created_at: string;
    updated_at: string;
}

export interface ParentProfileUpdate {
    display_name?: string;
    locale?: string;
    avatar_url?: string | null;
    avatar_svg?: string | null;
    phone?: string | null;
    timezone?: string;
    notification_preferences?: ParentNotificationPreferences;
}

export interface UploadedAsset {
    kind: 'image' | 'svg';
    content_type: string;
    filename: string;
    size: number;
    url: string;
    svg?: string | null;
}

export interface ChildProfileSession {
    child_token: string;
    token_type: 'bearer';
    child: ChildProfile;
}

export type PlacementStatus = 'started' | 'completed' | 'abandoned';
export type PlacementDifficulty = 'warmup' | 'target' | 'stretch';
export type PlacementBand = 'review' | 'ready' | 'stretch';

export interface PlacementQuestion {
    id: string;
    subject_id: string;
    prompt: string;
    choices: Array<string | number>;
    difficulty: PlacementDifficulty;
}

export interface PlacementAnswer {
    question_id: string;
    subject_id: string;
    difficulty: PlacementDifficulty;
    selected_value: string | number;
    correct: boolean;
    answered_at: string;
}

export interface PlacementResultSummary {
    subject_id: string;
    band: PlacementBand;
    accuracy: number;
    recommended_age_range_id?: string | null;
    recommended_skill_ids: string[];
    parent_summary: string;
}

export interface PlacementSession {
    _id: string;
    parent_user_id: string;
    child_profile_id: string;
    age_range_id?: string | null;
    subject_id: string;
    status: PlacementStatus;
    current_question_index: number;
    answers: PlacementAnswer[];
    result?: PlacementResultSummary | null;
    started_at: string;
    completed_at?: string | null;
}

export type SkillTemplate = 'mcq' | 'math-worksheet';

export interface McqPayload {
    choices: Array<string | number>;
}

export interface McqAnswer {
    value: string | number;
}

export interface MathWorksheetProblem {
    id: string;
    left: number;
    operator: '+' | '-';
    right: number;
}

export interface MathWorksheetPayload {
    layout: 'vertical' | 'horizontal';
    problems: MathWorksheetProblem[];
}

export interface MathWorksheetAnswer {
    values: Record<string, number>;
}

export type SkillQuestionPayload = McqPayload | MathWorksheetPayload;

export type SkillQuestionAnswer = McqAnswer | MathWorksheetAnswer;

export interface SkillQuestion {
    id: string;
    template: SkillTemplate;
    prompt: string;
    payload: SkillQuestionPayload;
    answer: SkillQuestionAnswer;
}

export interface RenderedQuestion {
    id: string;
    template: SkillTemplate;
    prompt: string;
    payload: SkillQuestionPayload;
    max_score: number;
}

export interface GradeResult {
    correct: boolean;
    score: number;
    max_score: number;
    feedback?: string | null;
}

export interface Skill {
    _id: string;
    slug: string;
    title: string;
    description: string;
    grade: string;
    locale: string;
    status: SkillStatus;
    tags: string[];
    questions: SkillQuestion[];
    created_by_user_id?: string | null;
    created_at: string;
    updated_at: string;
    published_at?: string | null;
}

export interface LessonAttempt {
    _id: string;
    child_profile_id: string;
    skill_id: string;
    status: AttemptStatus;
    score: number;
    max_score: number;
    started_at: string;
    completed_at?: string | null;
    answers: Record<string, unknown>[];
}

export interface XpLedgerEntry {
    _id: string;
    child_profile_id: string;
    source_type: 'lesson_attempt' | 'admin_adjustment' | 'streak_bonus';
    source_id: string;
    amount: number;
    reason: string;
    created_at: string;
}

export interface AppSetting {
    _id: string;
    key: string;
    value: Record<string, unknown>;
    updated_by_user_id?: string | null;
    updated_at: string;
}

export interface FeatureFlag {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
}

export interface FeaturesSettings {
    items: FeatureFlag[];
}

export interface XpSettings {
    lesson_complete: number;
    perfect_lesson_bonus: number;
    daily_goal: number;
}

export interface SubjectItem {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
}

export interface AgeRangeItem {
    id: string;
    label: string;
    short_label?: string;
    category?: string;
    ui_style?: string;
    description?: string;
    color?: string;
    min_age: number;
    max_age: number;
    subject_ids: string[];
    enabled: boolean;
}

export interface LearningCatalogSettings {
    subjects: SubjectItem[];
    age_ranges: AgeRangeItem[];
}
