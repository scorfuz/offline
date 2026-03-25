export interface HealthResponse {
  ok: true;
}

export function getHealthResponse(): HealthResponse {
  return { ok: true };
}
