// Push-notification business logic: device token storage, test pushes, and the due-soon reminder job.
import type { RegisterTokenInput } from '@pms/shared';
import { prisma } from '../../lib/prisma.js';
import { todayDateString, dateOnlyToUtcMidnight } from '../../lib/date.js';
import { sendPushToTokens } from '../../lib/fcm.js';
import { logger } from '../../lib/logger.js';

// Upserts a device's push token
export async function registerToken(userId: string, input: RegisterTokenInput): Promise<void> {
  await prisma.pushToken.upsert({
    where: { token: input.token },
    create: { userId, token: input.token, platform: input.platform },
    update: { userId, platform: input.platform, lastSeenAt: new Date() },
  });
}

// Deletes a device's push token
export async function unregisterToken(userId: string, token: string): Promise<void> {
  await prisma.pushToken.deleteMany({ where: { userId, token } });
}

// Sends a test push to all of a user's devices
export async function sendTestPush(userId: string): Promise<{ sent: number; total: number }> {
  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  const results = await sendPushToTokens(
    tokens.map((t) => t.token),
    {
      title: 'PMS test notification',
      body: 'Push notifications are working on this device.',
      data: { type: 'TEST' },
    },
  );
  await cleanupInvalidTokens(results);
  return { sent: results.filter((r) => r.success).length, total: results.length };
}

// Deletes tokens FCM reports as dead
async function cleanupInvalidTokens(results: { token: string; invalid: boolean }[]): Promise<void> {
  const invalidTokens = results.filter((r) => r.invalid).map((r) => r.token);
  if (invalidTokens.length > 0) {
    await prisma.pushToken.deleteMany({ where: { token: { in: invalidTokens } } });
  }
}

/**
 * Finds tasks due tomorrow (not yet completed) that haven't already had a DUE_SOON
 * push sent for that due date, sends one push per owner, and logs the attempt so a
 * second cron run the same day never double-sends.
 */
// Pushes reminders for tasks due tomorrow
export async function runDueSoonJob(): Promise<{ checked: number; sent: number }> {
  const tomorrowDate = dateOnlyToUtcMidnight(todayDateString());
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: tomorrowDate,
      status: { not: 'COMPLETED' },
      notificationLogs: { none: { kind: 'DUE_SOON', dueDate: tomorrowDate } },
    },
    select: {
      id: true,
      name: true,
      dueDate: true,
      project: { select: { id: true, ownerId: true, name: true } },
    },
  });

  let sent = 0;
  for (const task of tasks) {
    const tokens = await prisma.pushToken.findMany({
      where: { userId: task.project.ownerId },
      select: { token: true },
    });

    if (tokens.length > 0) {
      const results = await sendPushToTokens(
        tokens.map((t) => t.token),
        {
          title: 'Task due tomorrow',
          body: `${task.name} (${task.project.name}) is due tomorrow.`,
          data: { type: 'TASK_DUE_SOON', taskId: task.id, projectId: task.project.id },
        },
      );
      await cleanupInvalidTokens(results);
      if (results.some((r) => r.success)) sent += 1;
    }

    // Log the attempt regardless of delivery outcome — this row is the dedupe key,
    // not a delivery receipt, so a user with no registered devices is never retried forever.
    await prisma.notificationLog.create({
      data: { taskId: task.id, kind: 'DUE_SOON', dueDate: tomorrowDate },
    });
  }

  logger.info({ checked: tasks.length, sent }, 'Due-soon notification job finished');
  return { checked: tasks.length, sent };
}
