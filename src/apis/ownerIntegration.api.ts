import { axiosClient } from "@/lib/axios";

export interface OwnerIntegrationKeyMeta {
  hasKey: boolean;
  keyPrefix: string | null;
  isActive: boolean;
  createdAt: string | null;
  rotatedAt: string | null;
  lastUsedAt: string | null;
}

export interface RegenerateOwnerIntegrationKeyResponse {
  apiKey: string;
  meta: OwnerIntegrationKeyMeta;
}

export async function getOwnerIntegrationKeyMeta(): Promise<OwnerIntegrationKeyMeta> {
  const { data } = await axiosClient.get<OwnerIntegrationKeyMeta>("/api/owner/integration-key");
  return data;
}

export async function regenerateOwnerIntegrationKey(): Promise<RegenerateOwnerIntegrationKeyResponse> {
  const { data } = await axiosClient.post<RegenerateOwnerIntegrationKeyResponse>(
    "/api/owner/integration-key/regenerate",
    {},
  );
  return data;
}
