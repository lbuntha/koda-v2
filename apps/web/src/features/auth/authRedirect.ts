import type { Role } from '@koda/contracts';
import { isAdminRole } from '@/features/admin/hooks/useAdminAuth';

export function getPostAuthDestination(next: string, role: Role, fallback: string) {
    const safeNext = getSafeLocalPath(next);
    if (safeNext) {
        return canAccessPath(safeNext, role) ? safeNext : null;
    }

    const roleDestination = getDefaultRoleDestination(role);
    return canAccessPath(roleDestination, role) ? roleDestination : fallback;
}

export function getDefaultRoleDestination(role: Role) {
    if (role === 'admin') return '/admin';
    if (role === 'teacher') return '/teacher';
    if (role === 'student') return '/student';
    return '/profiles';
}

export function getSafeLocalPath(path: string) {
    if (!path.startsWith('/') || path.startsWith('//')) return null;
    return path;
}

function canAccessPath(path: string, role: Role) {
    return !isAdminPath(path) || isAdminRole(role);
}

function isAdminPath(path: string) {
    return path === '/admin' || path.startsWith('/admin/');
}
