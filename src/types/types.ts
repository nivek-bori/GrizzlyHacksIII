export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

// ROLES
export type Role = 'ADMIN' | 'USER' | 'GUEST';

const roleRank: Record<Role, number> = {
  GUEST: 0,
  USER: 1,
  ADMIN: 2,
};

function normalizeRole(role?: string | null): Role {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'USER') return 'USER';
  return 'GUEST';
}

export function isAuthorized(currentRole?: string | null, requiredRole?: string | null): boolean {
  if (!requiredRole) return true;
  const current = normalizeRole(currentRole);
  const required = normalizeRole(requiredRole);
  return roleRank[current] >= roleRank[required];
}