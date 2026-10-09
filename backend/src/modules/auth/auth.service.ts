import type { RegisterInput, LoginInput } from '@pms/shared';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword, verifyAgainstDummyHash } from '../../lib/password.js';
import { signAccessToken } from '../../lib/jwt.js';
import {
  generateOpaqueToken,
  hashToken,
  newFamilyId,
  refreshExpiryDate,
} from '../../lib/refreshToken.js';
import { AppError } from '../../lib/errors.js';
import { toUserDto, type UserDto } from '../../lib/dto.js';
import { recordAudit } from '../../lib/audit.js';

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

export interface AuthResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

async function createSession(userId: string, role: UserDto['role'], familyId: string, meta: SessionMeta) {
  const refreshToken = generateOpaqueToken();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: refreshExpiryDate(),
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  });
  const accessToken = signAccessToken({ sub: userId, sid: session.id, role });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput, meta: SessionMeta): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { fullName: input.fullName, email: input.email, passwordHash },
  });

  const { accessToken, refreshToken } = await createSession(user.id, user.role, newFamilyId(), meta);
  await recordAudit({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    ip: meta.ip,
  });
  return { user: toUserDto(user), accessToken, refreshToken };
}

export async function login(input: LoginInput, meta: SessionMeta): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    await verifyAgainstDummyHash(input.password);
    await recordAudit({
      action: 'LOGIN_FAILED',
      entityType: 'User',
      metadata: { email: input.email },
      ip: meta.ip,
    });
    throw AppError.unauthenticated('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    await recordAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      ip: meta.ip,
    });
    throw AppError.unauthenticated('Invalid email or password');
  }

  const { accessToken, refreshToken } = await createSession(user.id, user.role, newFamilyId(), meta);
  await recordAudit({
    userId: user.id,
    action: 'LOGIN_SUCCEEDED',
    entityType: 'User',
    entityId: user.id,
    ip: meta.ip,
  });
  return { user: toUserDto(user), accessToken, refreshToken };
}

export async function refresh(rawToken: string, meta: SessionMeta): Promise<AuthResult> {
  const tokenHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    throw AppError.unauthenticated('Invalid refresh token');
  }

  if (session.expiresAt < new Date()) {
    throw AppError.unauthenticated('Refresh token expired');
  }

  // Atomically claim this session: the WHERE revokedAt: null makes this a single
  // conditional UPDATE, so of two concurrent refresh() calls using the same token,
  // only one can ever see count === 1. Without this, both could read revokedAt as
  // null before either wrote it, and both would rotate the same token.
  const claim = await prisma.$transaction((tx) =>
    tx.session.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  );

  if (claim.count !== 1) {
    // Either we lost the race above, or this is reuse of an already-rotated token
    // (possible theft) — either way, revoke the whole family rather than trust it.
    await prisma.session.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw AppError.unauthenticated('Refresh token has already been used');
  }

  const { accessToken, refreshToken: newRefreshToken } = await createSession(
    session.userId,
    session.user.role,
    session.familyId,
    meta,
  );

  const newSession = await prisma.session.findUnique({
    where: { tokenHash: hashToken(newRefreshToken) },
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { replacedBy: newSession?.id },
  });

  return { user: toUserDto(session.user), accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, sessionId: string, meta: SessionMeta = {}): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
  await recordAudit({
    userId,
    action: 'LOGOUT',
    entityType: 'Session',
    entityId: sessionId,
    ip: meta.ip,
  });
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return toUserDto(user);
}
