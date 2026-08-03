const STORAGE_KEY = "pos_device_id";

function createDeviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") {
    return createDeviceId();
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && existing.length >= 8) {
    return existing;
  }

  const next = createDeviceId();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
