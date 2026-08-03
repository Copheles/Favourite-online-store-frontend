import { axiosClient } from "@/lib/axios";

export interface ManagedBranch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export async function listManagedBranches(): Promise<ManagedBranch[]> {
  const { data } = await axiosClient.get<{ items: ManagedBranch[] }>(
    "/super-admin/branches",
  );
  return data.items;
}

export async function createManagedBranch(
  input: CreateBranchInput,
): Promise<ManagedBranch> {
  const { data } = await axiosClient.post<ManagedBranch>(
    "/super-admin/branches",
    input,
  );
  return data;
}

export async function updateManagedBranch(
  id: string,
  input: UpdateBranchInput,
): Promise<ManagedBranch> {
  const { data } = await axiosClient.patch<ManagedBranch>(
    `/super-admin/branches/${id}`,
    input,
  );
  return data;
}
