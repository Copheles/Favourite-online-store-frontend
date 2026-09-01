import { axiosClient } from "@/lib/axios";

export interface BranchShopInfo {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
}

export interface UpdateCurrentBranchShopInfoInput {
  name: string;
  address?: string;
  phone?: string;
}

export async function updateCurrentBranchShopInfo(
  input: UpdateCurrentBranchShopInfoInput,
): Promise<BranchShopInfo> {
  const { data } = await axiosClient.patch<BranchShopInfo>(
    "/api/branches/current/shop-info",
    input,
  );
  return data;
}
