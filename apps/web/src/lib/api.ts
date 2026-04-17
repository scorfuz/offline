import { ParseResult, Schema } from "effect";

const API_BASE_URL: string =
  (import.meta.env.VITE_API_ORIGIN as string | undefined) ??
  "http://localhost:3001";

function decodeWithSchema<A, I>(
  schema: Schema.Schema<A, I, any>,
  input: unknown,
  label: string
): A {
  try {
    return Schema.decodeUnknownSync(schema as Schema.Schema<A, I, never>)(
      input
    );
  } catch (error) {
    if (ParseResult.isParseError(error)) {
      throw new Error(`${label}: ${error.message}`);
    }

    throw error;
  }
}

export async function apiFetch<A, I>(
  path: string,
  schema: Schema.Schema<A, I, never>,
  init?: RequestInit
): Promise<A> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error: ${response.status}`);
  }

  const responseJson = await response.json();
  return decodeWithSchema(
    schema,
    responseJson,
    `Invalid API response for ${path}`
  );
}

export function apiPost<A, I, BodyA, BodyI>(
  path: string,
  responseSchema: Schema.Schema<A, I, never>,
  bodySchema: Schema.Schema<BodyA, BodyI, never>,
  body: unknown
): Promise<A> {
  const decoded = decodeWithSchema(
    bodySchema,
    body,
    `Invalid API request for ${path}`
  );
  const serialized = JSON.stringify(decoded);
  return apiFetch(path, responseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
  });
}

export function apiPut<A, I, BodyA, BodyI>(
  path: string,
  responseSchema: Schema.Schema<A, I, never>,
  bodySchema: Schema.Schema<BodyA, BodyI, never>,
  body: unknown
): Promise<A> {
  const decoded = decodeWithSchema(
    bodySchema,
    body,
    `Invalid API request for ${path}`
  );
  const serialized = JSON.stringify(decoded);
  return apiFetch(path, responseSchema, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: serialized,
  });
}

export function apiDelete<A, I>(
  path: string,
  schema: Schema.Schema<A, I, never>
): Promise<A> {
  return apiFetch(path, schema, { method: "DELETE" });
}
