const API_BASE_URL = (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.hsyt.org/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch (_) {
      // ignore parse errors
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json();
  return json as T;
}

export default request;
