export type Role = 'student' | 'parent' | 'teacher' | 'admin' | 'superadmin';

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
}

export interface RolesSettings {
    permissions: RolePermission[];
    roles: RoleRights[];
}

export interface ChildProfile {
    _id: string;
    parent_user_id: string;
    display_name: string;
    grade?: string | null;
    locale: string;
    active_skill_ids: string[];
    created_at: string;
    updated_at: string;
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
