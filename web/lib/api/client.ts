const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Only session/token failures get the "expired" wording. A failed
      // sign-in is also a 401, and its message ("Invalid credentials.")
      // should reach the user unchanged.
      if (/session|token/i.test(error.message)) {
        return "Your session expired. Please sign in again.";
      }
      return error.message || "Your session expired. Please sign in again.";
    }
    return error.message;
  }
  if (error instanceof TypeError) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

function parseMessage(body: unknown, fallback: string) {
  if (typeof body === "string" && body.trim()) return body;
  if (!body || typeof body !== "object") return fallback;

  const record = body as Record<string, unknown>;
  const message = record.message;

  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(" ");
  }
  if (typeof message === "string" && message.trim()) return message;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      cache: "no-store",
      ...rest,
      headers: {
        ...(json === undefined ? {} : { "Content-Type": "application/json" }),
        ...(headers ?? {}),
      },
      body: json === undefined ? rest.body : JSON.stringify(json),
    });
  } catch {
    throw new ApiError(0, "We couldn't reach the server. Check your connection and try again.");
  }

  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parseMessage(body, `The request failed (${response.status}).`),
      body,
    );
  }

  return body as T;
}
