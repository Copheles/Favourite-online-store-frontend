export type Role = "super_admin" | "owner" | "admin" | "staff" | "monitor";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
}

export interface AuthUser {
  role: Role;
  username: string;
  staffId?: string;
  defaultBranchId: string;
  accessibleBranchIds: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
  deviceId: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface BranchAccessResponse {
  defaultBranch: Branch;
  accessibleBranches: Branch[];
}

export interface FieldErrors {
  [field: string]: string;
}

export interface ApiError {
  message: string;
  errors?: FieldErrors;
}

export function isBusinessAdminRole(role?: Role | string | null): boolean {
  const normalized = role?.toLowerCase();
  return normalized === "owner" || normalized === "admin";
}

/** POS, settings, branch switch — excludes user-management (super_admin only). */
export function hasStoreOperatorAccessRole(role?: Role | string | null): boolean {
  const normalized = role?.toLowerCase();
  return (
    normalized === "super_admin" ||
    normalized === "owner" ||
    normalized === "admin"
  );
}

/**
 * @deprecated Use isBusinessAdminRole or hasStoreOperatorAccessRole.
 */
export function isAdminLikeRole(role?: Role | string | null): boolean {
  return isBusinessAdminRole(role);
}

export function isMonitorRole(role?: Role | string | null): boolean {
  return role?.toLowerCase() === "monitor";
}

export function canPerformWrites(role?: Role | string | null): boolean {
  return !isMonitorRole(role);
}

export function isSuperAdminRole(role?: Role | string | null): boolean {
  return role?.toLowerCase() === "super_admin";
}
