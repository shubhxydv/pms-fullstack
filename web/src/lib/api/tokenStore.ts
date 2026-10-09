// In-memory holder for the current access token (never persisted to storage).
let accessToken: string | null = null;

// Returns current access token
export function getAccessToken(): string | null {
  return accessToken;
}

// Stores the access token in memory
export function setAccessToken(token: string | null): void {
  accessToken = token;
}
