/**
 * Centralized query key factories.
 *
 * Rules:
 *  - Every query key in the app MUST be generated from this file.
 *  - Keys are hierarchical: entity → sub-type → id/filters.
 *  - Prefix invalidation works by calling `queryClient.invalidateQueries({ queryKey: fooKeys.all })`.
 */

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

// ── Current User ─────────────────────────────────────────────────────────────

export const meKeys = {
  all: ["me"] as const,
};
