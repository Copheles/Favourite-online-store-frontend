import { posModules, type PosModule } from "@/constants/posModules";
import { isSuperAdminRole, type Role } from "@/types/auth";

/**
 * Module visibility:
 * - super_admin: all tiles including User/Branch management.
 * - owner | admin | staff | monitor: business modules only (no super_admin-only tiles).
 * - monitor: same as above except Sale (/sale) is excluded from posModules roles.
 */
export function getVisiblePosModules(role: Role | undefined): PosModule[] {
  if (isSuperAdminRole(role)) {
    return posModules;
  }

  return posModules.filter(
    (module) =>
      !module.roles?.includes("super_admin") &&
      (!module.roles || module.roles.includes(role ?? "staff")),
  );
}
