import type { Request, Response } from 'express';
import type { RegisterTokenInput } from '@pms/shared';
import * as notificationsService from './notifications.service.js';
import { AppError } from '../../lib/errors.js';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

export async function registerTokenHandler(req: Request, res: Response): Promise<void> {
  await notificationsService.registerToken(userId(req), req.body as RegisterTokenInput);
  res.status(204).send();
}

export async function unregisterTokenHandler(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  await notificationsService.unregisterToken(userId(req), token);
  res.status(204).send();
}

export async function testPushHandler(req: Request, res: Response): Promise<void> {
  const result = await notificationsService.sendTestPush(userId(req));
  res.status(200).json({ data: result });
}

export async function dueSoonCronHandler(_req: Request, res: Response): Promise<void> {
  const result = await notificationsService.runDueSoonJob();
  res.status(200).json({ data: result });
}
