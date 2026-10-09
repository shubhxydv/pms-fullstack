import * as SecureStore from 'expo-secure-store';

// In-memory + SecureStore-backed storage for the access and refresh tokens.
const ACCESS_TOKEN_KEY = 'pms_access_token';
const REFRESH_TOKEN_KEY = 'pms_refresh_token';

let accessToken: string | null = null;
let refreshToken: string | null = null;

// Returns the in-memory access token
export function getAccessToken(): string | null {
  return accessToken;
}

// Returns the in-memory refresh token
export function getRefreshToken(): string | null {
  return refreshToken;
}

// Saves both tokens to memory and storage
export async function setTokens(nextAccessToken: string, nextRefreshToken: string): Promise<void> {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, nextAccessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextRefreshToken);
}

// Clears both tokens from memory and storage
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/** Loads tokens from SecureStore into memory on app start. Returns true if a refresh token was found. */
export async function loadTokensFromStorage(): Promise<boolean> {
  const [storedAccess, storedRefresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  accessToken = storedAccess;
  refreshToken = storedRefresh;
  return Boolean(storedRefresh);
}
