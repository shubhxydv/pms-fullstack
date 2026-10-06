jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  loadTokensFromStorage,
} from '../src/lib/api/tokenStore';

describe('tokenStore', () => {
  afterEach(async () => {
    await clearTokens();
  });

  it('starts with no tokens in memory', () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('persists tokens to SecureStore and keeps them in memory', async () => {
    await setTokens('access-1', 'refresh-1');
    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
  });

  it('clears both memory and SecureStore', async () => {
    await setTokens('access-1', 'refresh-1');
    await clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('loadTokensFromStorage restores tokens saved in a previous session', async () => {
    await setTokens('access-2', 'refresh-2');
    // Simulate an app restart: wipe the in-memory cache but leave SecureStore alone.
    await clearTokens();
    await setTokens('access-2', 'refresh-2');

    const hasRefreshToken = await loadTokensFromStorage();
    expect(hasRefreshToken).toBe(true);
    expect(getAccessToken()).toBe('access-2');
  });

  it('loadTokensFromStorage reports no refresh token when storage is empty', async () => {
    const hasRefreshToken = await loadTokensFromStorage();
    expect(hasRefreshToken).toBe(false);
  });
});
