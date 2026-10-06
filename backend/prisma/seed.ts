import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword('Password123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { fullName: 'Admin User', email: 'admin@example.com', passwordHash, role: 'ADMIN' },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { fullName: 'Alice Demo', email: 'alice@example.com', passwordHash, role: 'USER' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { fullName: 'Bob Demo', email: 'bob@example.com', passwordHash, role: 'USER' },
  });

  const today = new Date();
  const inDays = (n: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + n);
    return new Date(d.toISOString().slice(0, 10));
  };

  const aliceProject = await prisma.project.create({
    data: {
      ownerId: alice.id,
      name: 'Website Redesign',
      description: 'Revamp the marketing site',
      status: 'IN_PROGRESS',
      startDate: inDays(-10),
      endDate: inDays(20),
      tasks: {
        create: [
          { name: 'Wireframes', priority: 'HIGH', status: 'COMPLETED', dueDate: inDays(-5) },
          { name: 'Homepage build', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: inDays(1) },
          { name: 'SEO audit', priority: 'MEDIUM', status: 'PENDING', dueDate: inDays(3) },
          { name: 'Launch checklist', priority: 'LOW', status: 'PENDING', dueDate: inDays(15) },
        ],
      },
    },
  });

  const bobProject = await prisma.project.create({
    data: {
      ownerId: bob.id,
      name: 'Mobile App Beta',
      description: 'Internal beta rollout',
      status: 'NOT_STARTED',
      startDate: inDays(0),
      endDate: inDays(30),
      tasks: {
        create: [
          { name: 'Recruit testers', priority: 'MEDIUM', status: 'PENDING', dueDate: inDays(2) },
          { name: 'Prepare build', priority: 'HIGH', status: 'PENDING', dueDate: inDays(1) },
        ],
      },
    },
  });

  console.log('Seeded:', {
    admin: admin.email,
    alice: alice.email,
    bob: bob.email,
    aliceProject: aliceProject.name,
    bobProject: bobProject.name,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
