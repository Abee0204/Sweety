const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  method?: ApiMethod;
  body?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const getErrorMessage = (
  data: unknown,
  statusText: string,
  status: number,
): string => {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return statusText || `Request failed with status ${status}`;
};

export const apiRequest = async <T = unknown>(
  path: string,
  { method = "GET", body }: ApiRequestOptions = {},
): Promise<T | undefined> => {
  const normalizedPath = path.replace(/^\/+/, "");
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const responseText = await response.text();
  let responseData: unknown;

  if (responseText.trim()) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new ApiError(
          "The API returned an invalid JSON response",
          response.status,
        );
      }
      responseData = responseText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(responseData, response.statusText, response.status),
      response.status,
      responseData,
    );
  }

  return responseData as T | undefined;
};

export const apiClient = {
  get: <T = unknown>(path: string) => apiRequest<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T = unknown>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "DELETE", body }),
};
