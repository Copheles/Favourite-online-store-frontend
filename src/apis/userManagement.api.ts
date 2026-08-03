import { axiosClient } from "@/lib/axios";
import type { Branch } from "@/types/auth";

export type ManagedUserRole = "owner" | "admin" | "staff" | "monitor";

export interface ManagedUser {
  id: string;
  username: string;
  displayName: string | null;
  role: ManagedUserRole;
  defaultBranchId: string;
  maxAllowedDevices: number;
  isActive: boolean;
  createdAt: string;
  activeSessionCount: number;
  accessibleBranches: Branch[];
}

export interface ManagedUserSession {
  id: string;
  userAgent: string | null;
  deviceLabel: string;
  createdAt: string;
  expiresAt: string;
}

export type ManagedUserDetail = ManagedUser & {
  sessions: ManagedUserSession[];
};

export interface CreateUserInput {
  username: string;
  displayName?: string;
  initialPassword: string;
  role: ManagedUserRole;
  defaultBranchId: string;
  accessibleBranchIds?: string[];
  maxAllowedDevices?: number;
}

export interface UpdateUserInput {
  username?: string;
  displayName?: string | null;
  role?: ManagedUserRole;
  defaultBranchId?: string;
  accessibleBranchIds?: string[];
  maxAllowedDevices?: number;
  isActive?: boolean;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const { data } = await axiosClient.get<{ items: ManagedUser[] }>(
    "/super-admin/users",
  );
  return data.items;
}

export async function createManagedUser(
  input: CreateUserInput,
): Promise<ManagedUser> {
  const { data } = await axiosClient.post<ManagedUser>(
    "/super-admin/users",
    input,
  );
  return data;
}

export async function updateManagedUser(
  id: string,
  input: UpdateUserInput,
): Promise<ManagedUser> {
  const { data } = await axiosClient.patch<ManagedUser>(
    `/super-admin/users/${id}`,
    input,
  );
  return data;
}

export async function resetManagedUserPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  await axiosClient.patch(`/super-admin/users/${id}/password`, { newPassword });
}

export async function getManagedUser(id: string): Promise<ManagedUserDetail> {
  const { data } = await axiosClient.get<ManagedUserDetail>(
    `/super-admin/users/${id}`,
  );
  return data;
}

export async function revokeManagedSession(
  sessionId: string,
): Promise<void> {
  await axiosClient.delete(`/super-admin/sessions/${sessionId}`);
}
