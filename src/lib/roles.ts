// 4 role types from Agency Platform docs
export type UserRole = 'owner' | 'administrator' | 'manager' | 'agent';
export type Floor = 1 | 2;

// Roles that can access Floor 2 (Agency View)
const FLOOR_2_ROLES: UserRole[] = ['owner', 'administrator', 'manager'];

export function canAccessFloor2(role: UserRole | string): boolean {
  // Backward compat: old sessions may still have 'admin'
  if (role === 'admin') return true;
  return FLOOR_2_ROLES.includes(role as UserRole);
}

export function getDataFilter(floor: Floor, userEmail: string) {
  if (floor === 2) return {}; // No filter — see all data
  return { user_email: userEmail }; // Floor 1 — own data only
}

export const FLOOR_LABELS = {
  1: { name: 'Agent View', icon: '👤', description: 'Your personal commission tracker' },
  2: { name: 'Agency View', icon: '🏢', description: 'Agency-wide management dashboard' },
};

export const ROLE_LABELS: Record<UserRole, { name: string; icon: string; description: string }> = {
  owner: { name: 'Owner', icon: '👑', description: 'Agency owner — full access to everything' },
  administrator: { name: 'Administrator', icon: '⚙️', description: 'System admin — settings, team, integrations' },
  manager: { name: 'Manager', icon: '📊', description: 'Management — team performance, agent oversight' },
  agent: { name: 'Agent', icon: '👤', description: 'Producer — own policies and commissions' },
};

// Who can manage team members?
export function canManageTeam(role: UserRole): boolean {
  return role === 'owner' || role === 'administrator';
}

// Who can change agency settings?
export function canManageSettings(role: UserRole): boolean {
  return role === 'owner' || role === 'administrator';
}

// Who can assign roles? (only owner can promote to admin)
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  if (assignerRole === 'owner') return true; // Owner can assign any role
  if (assignerRole === 'administrator') return targetRole === 'manager' || targetRole === 'agent';
  return false;
}

// Navigation items that are admin-only (Floor 2)
export const ADMIN_ONLY_PAGES = [
  '/dashboard/admin',
];

// Pages that should only appear on Floor 2 (Agency View)
export const FLOOR_2_ONLY_PAGES = [
  '/dashboard/tools',
  '/dashboard/policies/search',
  '/dashboard/policies',
  '/dashboard/policies/edit',
  '/dashboard/policies/new',
];
