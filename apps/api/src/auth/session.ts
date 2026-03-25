import type { AppAuth } from "./config";

export async function getSession(auth: AppAuth, headers: Headers) {
  return auth.api.getSession({ headers });
}
