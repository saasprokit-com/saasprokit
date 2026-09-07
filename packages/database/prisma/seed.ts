import {
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  MILLISECONDS_PER_DAY,
} from "@repo/utils/date";
import { LIMITS, PLAN_NAMES, SUBSCRIPTION_STATUS } from "@repo/utils/payment";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../generated/client-node/client";

if (process.env.NODE_ENV === "production") {
  console.error("Seed script cannot run in production environment.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const HISTORY_DAYS = 90;
const FILLER_USER_COUNT = 180;
const ACME_PICK_EVERY = 4;
const FOUNDING_OFFSET_DAYS = 30;

const FIRST_NAMES =
  "Ada Ben Cara Dev Elin Femi Gus Hana Ivo Jae Kit Lena Mo Nia Oli Pia Quinn Rui Sana Tomas".split(
    " "
  );

const LAST_NAMES =
  "Silva Okafor Nakamura Dubois Kowalski Rossi Haddad Andersen Petrov Mensah".split(
    " "
  );

function daysAgo(now: Date, days: number): Date {
  const startOfToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  return new Date(startOfToday - days * MILLISECONDS_PER_DAY);
}

function signupDates(now: Date, days: number, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const dayIndex = Math.floor(Math.sqrt(index / count) * (days - 1));
    const date = daysAgo(now, days - 1 - dayIndex);

    date.setUTCHours(9 + (index % 9), (index * 7) % 60, 0, 0);

    return date;
  });
}

async function main() {
  const now = new Date();
  const historyStart = daysAgo(now, HISTORY_DAYS);

  // Clean all tables in FK-safe order (leaf → root)
  await prisma.$transaction([
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.inviteLink.deleteMany(),
    prisma.file.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.member.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.twoFactor.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Hash passwords
  const hashedPassword = await hashPassword("Password@saaspro");

  const adminUserId = randomUUID();
  const moderatorUserId = randomUUID();
  const regularUser1Id = randomUUID();
  const regularUser2Id = randomUUID();
  const unverifiedUserId = randomUUID();
  const bannedUserId = randomUUID();
  const twoFactorUserId = randomUUID();

  await prisma.user.createMany({
    data: [
      {
        id: adminUserId,
        name: "Admin User",
        email: "admin@example.com",
        emailVerified: true,
        role: "admin",
        firstName: "Admin",
        lastName: "User",
      },
      {
        id: moderatorUserId,
        name: "Moderator User",
        email: "moderator@example.com",
        emailVerified: true,
        role: "moderator",
        firstName: "Moderator",
        lastName: "User",
      },
      {
        id: regularUser1Id,
        name: "John Doe",
        email: "john@example.com",
        emailVerified: true,
        role: "user",
        firstName: "John",
        lastName: "Doe",
      },
      {
        id: regularUser2Id,
        name: "Jane Smith",
        email: "jane@example.com",
        emailVerified: true,
        role: "user",
        firstName: "Jane",
        lastName: "Smith",
      },
      {
        id: unverifiedUserId,
        name: "New User",
        email: "newuser@example.com",
        emailVerified: false,
        role: "user",
        firstName: "New",
        lastName: "User",
      },
      {
        id: bannedUserId,
        name: "Banned User",
        email: "banned@example.com",
        emailVerified: true,
        role: "user",
        banned: true,
        banReason: "Violation of terms of service",
        banExpires: new Date(
          Date.now() + DAYS_PER_MONTH * MILLISECONDS_PER_DAY
        ),
      },
      {
        id: twoFactorUserId,
        name: "Secure User",
        email: "secure@example.com",
        emailVerified: true,
        role: "user",
        twoFactorEnabled: true,
        firstName: "Secure",
        lastName: "User",
      },
    ],
  });

  await prisma.account.createMany({
    data: [
      {
        userId: adminUserId,
        accountId: adminUserId,
        providerId: "credential",
        password: hashedPassword,
      },
      {
        userId: moderatorUserId,
        accountId: moderatorUserId,
        providerId: "credential",
        password: hashedPassword,
      },
      {
        userId: regularUser1Id,
        accountId: regularUser1Id,
        providerId: "credential",
        password: hashedPassword,
      },
      {
        userId: regularUser2Id,
        accountId: regularUser2Id,
        providerId: "credential",
        password: hashedPassword,
      },
      {
        userId: unverifiedUserId,
        accountId: unverifiedUserId,
        providerId: "credential",
        password: hashedPassword,
      },
      {
        userId: bannedUserId,
        accountId: bannedUserId,
        providerId: "credential",
        password: hashedPassword,
      },
      {
        userId: twoFactorUserId,
        accountId: twoFactorUserId,
        providerId: "credential",
        password: hashedPassword,
      },
      // Social account example (Google)
      {
        userId: regularUser1Id,
        accountId: "google-oauth-id-123",
        providerId: "google",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        scope: "openid email profile",
      },
    ],
  });

  await prisma.twoFactor.create({
    data: {
      userId: twoFactorUserId,
      secret: "JBSWY3DPEHPK3PXP", // Example TOTP secret
      backupCodes: JSON.stringify([
        "ABC123",
        "DEF456",
        "GHI789",
        "JKL012",
        "MNO345",
        "PQR678",
        "STU901",
        "VWX234",
      ]),
    },
  });

  const adminWorkspaceId = randomUUID();
  const moderatorWorkspaceId = randomUUID();
  const johnWorkspaceId = randomUUID();
  const janeWorkspaceId = randomUUID();
  const secureWorkspaceId = randomUUID();
  const acmeOrgId = randomUUID();
  const startupOrgId = randomUUID();
  const enterpriseOrgId = randomUUID();

  await prisma.organization.createMany({
    data: [
      { id: adminWorkspaceId, name: "Admin's Workspace", slug: "admin-user" },
      {
        id: moderatorWorkspaceId,
        name: "Moderator's Workspace",
        slug: "moderator-user",
      },
      { id: johnWorkspaceId, name: "John's Workspace", slug: "john-doe" },
      { id: janeWorkspaceId, name: "Jane's Workspace", slug: "jane-smith" },
      {
        id: secureWorkspaceId,
        name: "Secure's Workspace",
        slug: "secure-user",
      },
      {
        id: acmeOrgId,
        name: "Acme Corporation",
        slug: "acme-corp",
        metadata: JSON.stringify({
          industry: "Technology",
          size: "50-200",
          website: "https://acme.example.com",
        }),
      },
      {
        id: startupOrgId,
        name: "Startup Labs",
        slug: "startup-labs",
        metadata: JSON.stringify({
          industry: "Software",
          size: "1-10",
          website: "https://startuplabs.example.com",
        }),
      },
      {
        id: enterpriseOrgId,
        name: "Enterprise Inc",
        slug: "enterprise-inc",
        metadata: JSON.stringify({
          industry: "Finance",
          size: "1000+",
          website: "https://enterprise.example.com",
        }),
      },
    ],
  });

  await prisma.member.createMany({
    data: [
      // Default workspace owners
      {
        organizationId: adminWorkspaceId,
        userId: adminUserId,
        role: "owner",
      },
      {
        organizationId: moderatorWorkspaceId,
        userId: moderatorUserId,
        role: "owner",
      },
      {
        organizationId: johnWorkspaceId,
        userId: regularUser1Id,
        role: "owner",
      },
      {
        organizationId: janeWorkspaceId,
        userId: regularUser2Id,
        role: "owner",
      },
      {
        organizationId: secureWorkspaceId,
        userId: twoFactorUserId,
        role: "owner",
      },

      // Acme Corp members
      {
        organizationId: acmeOrgId,
        userId: adminUserId,
        role: "owner",
        createdAt: historyStart,
      },
      {
        organizationId: acmeOrgId,
        userId: regularUser1Id,
        role: "admin",
        createdAt: historyStart,
      },
      {
        organizationId: acmeOrgId,
        userId: regularUser2Id,
        role: "member",
        createdAt: historyStart,
      },

      // Startup Labs members
      {
        organizationId: startupOrgId,
        userId: regularUser1Id,
        role: "owner",
      },
      {
        organizationId: startupOrgId,
        userId: twoFactorUserId,
        role: "member",
      },

      // Enterprise Inc members
      {
        organizationId: enterpriseOrgId,
        userId: moderatorUserId,
        role: "owner",
      },
      {
        organizationId: enterpriseOrgId,
        userId: adminUserId,
        role: "admin",
      },
    ],
  });

  await prisma.invitation.createMany({
    data: [
      {
        organizationId: acmeOrgId,
        email: "invite1@example.com",
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        inviterId: adminUserId,
      },
      {
        organizationId: startupOrgId,
        email: "invite2@example.com",
        role: "admin",
        status: "pending",
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        inviterId: regularUser1Id,
      },
      {
        organizationId: acmeOrgId,
        email: "expired@example.com",
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() - MILLISECONDS_PER_DAY),
        inviterId: adminUserId,
      },
    ],
  });

  await prisma.subscription.createMany({
    data: [
      {
        plan: PLAN_NAMES.FREE,
        referenceId: regularUser2Id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
      {
        plan: PLAN_NAMES.ENTERPRISE,
        referenceId: acmeOrgId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: LIMITS.ENTERPRISE.MAX_MEMBERS,
      },
      {
        plan: PLAN_NAMES.FREE,
        referenceId: enterpriseOrgId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
      {
        plan: PLAN_NAMES.PRO,
        referenceId: startupOrgId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
      {
        plan: PLAN_NAMES.FREE,
        referenceId: unverifiedUserId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
    ],
  });

  const foundingDate = daysAgo(now, HISTORY_DAYS + FOUNDING_OFFSET_DAYS);

  await Promise.all([
    prisma.user.updateMany({ data: { createdAt: foundingDate } }),
    prisma.organization.updateMany({ data: { createdAt: foundingDate } }),
  ]);

  await prisma.user.update({
    where: { id: adminUserId },
    data: { defaultOrganizationId: acmeOrgId },
  });

  const dates = signupDates(now, HISTORY_DAYS, FILLER_USER_COUNT);

  const fillerUsers = dates.map((createdAt, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[index % LAST_NAMES.length];

    return {
      id: randomUUID(),
      name: `${firstName} ${lastName}`,
      email: `member${index + 1}@example.com`,
      emailVerified: true,
      firstName,
      lastName,
      createdAt,
    };
  });

  await prisma.user.createMany({ data: fillerUsers });

  const acmeFillers = fillerUsers.filter(
    (_, index) => index % ACME_PICK_EVERY === 0
  );

  await prisma.member.createMany({
    data: acmeFillers.map((user) => ({
      organizationId: acmeOrgId,
      userId: user.id,
      role: "member",
      createdAt: user.createdAt,
    })),
  });

  console.log(`Seeded ${fillerUsers.length} users over ${HISTORY_DAYS} days.`);

  await prisma.session.createMany({
    data: [
      {
        userId: adminUserId,
        token: `session_${adminUserId}_${Date.now()}`,
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        ipAddress: "192.168.1.1",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      {
        userId: regularUser1Id,
        token: `session_${regularUser1Id}_${Date.now()}`,
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        ipAddress: "192.168.1.2",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    ],
  });
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
