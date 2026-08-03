import { axiosClient } from "@/lib/axios";

export interface StoreSettings {
  pointsCashbackPercent: number;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  receiptPaperWidthMm: number;
}

export type UpdateStoreSettingsInput = Partial<StoreSettings>;

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data } = await axiosClient.get<StoreSettings>("/api/settings");
  return data;
}

export async function updateStoreSettings(
  input: UpdateStoreSettingsInput,
): Promise<StoreSettings> {
  const { data } = await axiosClient.patch<StoreSettings>("/api/settings", input);
  return data;
}
