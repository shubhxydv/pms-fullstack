import { existsSync, readFileSync } from 'node:fs';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let app: App | null = null;
let warnedOnce = false;

function loadServiceAccount(): Record<string, unknown> | null {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, unknown>;
  }
  if (existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    return JSON.parse(readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8')) as Record<
      string,
      unknown
    >;
  }
  return null;
}

function getFirebaseApp(): App | null {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    if (!warnedOnce) {
      logger.warn(
        'FCM not configured (no FIREBASE_SERVICE_ACCOUNT_JSON or secrets file) — push notifications will no-op',
      );
      warnedOnce = true;
    }
    return null;
  }

  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  token: string;
  success: boolean;
  /** True when FCM reports the token is no longer valid and should be deleted. */
  invalid: boolean;
}

/** Sends one push per token. Never throws — a configuration or delivery failure just no-ops/fails per-token. */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload,
): Promise<PushResult[]> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || tokens.length === 0) {
    return tokens.map((token) => ({ token, success: false, invalid: false }));
  }

  const messaging = getMessaging(firebaseApp);
  const results = await Promise.all(
    tokens.map(async (token): Promise<PushResult> => {
      try {
        await messaging.send({
          token,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
          android: { priority: 'high' },
        });
        return { token, success: true, invalid: false };
      } catch (err) {
        const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code;
        const invalid =
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered';
        if (!invalid) {
          logger.error({ err, token }, 'FCM send failed');
        }
        return { token, success: false, invalid };
      }
    }),
  );
  return results;
}
