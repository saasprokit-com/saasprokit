import {
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  MILLISECONDS_PER_DAY,
} from "@repo/utils/date";
import { LIMITS, PLAN_NAMES, SUBSCRIPTION_STATUS } from "@repo/utils/payment";
import "dotenv/config";
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
const WEEKEND_WEIGHT = 0.25;
const TREND_FLOOR = 0.6;
const TREND_RISE = 0.8;
const SATURDAY = 6;
const SUNDAY = 0;
const FIRST_EVENT_HOUR = 9;
const EVENT_HOUR_SPREAD = 9;
const EVENT_MINUTE_STEP = 7;
const MINUTES_PER_HOUR = 60;

const FIRST_NAMES = [
  "Ada",
  "Ben",
  "Cara",
  "Dev",
  "Elin",
  "Femi",
  "Gus",
  "Hana",
  "Ivo",
  "Jae",
  "Kit",
  "Lena",
  "Mo",
  "Nia",
  "Oli",
  "Pia",
  "Quinn",
  "Rui",
  "Sana",
  "Tomas",
];

const LAST_NAMES = [
  "Silva",
  "Okafor",
  "Nakamura",
  "Dubois",
  "Kowalski",
  "Rossi",
  "Haddad",
  "Andersen",
  "Petrov",
  "Mensah",
];

function daysAgo(now: Date, days: number): Date {
  const startOfToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  return new Date(startOfToday - days * MILLISECONDS_PER_DAY);
}

function dailyWeights(now: Date, days: number): number[] {
  return Array.from({ length: days }, (_, index) => {
    const day = daysAgo(now, days - 1 - index).getUTCDay();
    const isWeekend = day === SATURDAY || day === SUNDAY;
    const trend = TREND_FLOOR + (TREND_RISE * index) / (days - 1);

    return (isWeekend ? WEEKEND_WEIGHT : 1) * trend;
  });
}

function allocate(count: number, weights: number[]): number[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (count * weight) / total);
  const allocated = exact.map((value) => Math.floor(value));
  let remaining = count - allocated.reduce((sum, value) => sum + value, 0);

  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const entry of byFraction) {
    if (remaining <= 0) {
      break;
    }
    allocated[entry.index] += 1;
    remaining -= 1;
  }

  return allocated;
}

function weekdayWeightedDates(now: Date, days: number, count: number): Date[] {
  const perDay = allocate(count, dailyWeights(now, days));
  const dates: Date[] = [];

  perDay.forEach((total, dayIndex) => {
    for (let slot = 0; slot < total; slot += 1) {
      const date = daysAgo(now, days - 1 - dayIndex);
      date.setUTCHours(
        FIRST_EVENT_HOUR + (slot % EVENT_HOUR_SPREAD),
        (slot * EVENT_MINUTE_STEP) % MINUTES_PER_HOUR,
        0,
        0
      );
      dates.push(date);
    }
  });

  return dates;
}

async function main() {
  const now = new Date();
  const historyStart = daysAgo(now, HISTORY_DAYS);

  // Clean all tables in FK-safe order (leaf → root)
  // Team tables may not exist yet if schema hasn't been fully pushed
  await prisma.teamMember.deleteMany().catch((error: unknown) => {
    console.warn(
      "Skipping teamMember cleanup:",
      error instanceof Error ? error.message : error
    );
  });
  await prisma.team.deleteMany().catch((error: unknown) => {
    console.warn(
      "Skipping team cleanup:",
      error instanceof Error ? error.message : error
    );
  });
  await prisma.inviteLink.deleteMany().catch((error: unknown) => {
    console.warn(
      "Skipping inviteLink cleanup:",
      error instanceof Error ? error.message : error
    );
  });
  await prisma.file.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.member.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.twoFactor.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const hashedPassword = await hashPassword("Password@saaspro");

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      emailVerified: true,
      role: "admin",
      firstName: "Admin",
      lastName: "User",
    },
  });

  const moderatorUser = await prisma.user.create({
    data: {
      name: "Moderator User",
      email: "moderator@example.com",
      emailVerified: true,
      role: "moderator",
      firstName: "Moderator",
      lastName: "User",
    },
  });

  const regularUser1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      emailVerified: true,
      role: "user",
      firstName: "John",
      lastName: "Doe",
    },
  });

  const regularUser2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      emailVerified: true,
      role: "user",
      firstName: "Jane",
      lastName: "Smith",
    },
  });

  const unverifiedUser = await prisma.user.create({
    data: {
      name: "New User",
      email: "newuser@example.com",
      emailVerified: false,
      role: "user",
      firstName: "New",
      lastName: "User",
    },
  });

  const bannedUser = await prisma.user.create({
    data: {
      name: "Banned User",
      email: "banned@example.com",
      emailVerified: true,
      role: "user",
      banned: true,
      banReason: "Violation of terms of service",
      banExpires: new Date(Date.now() + DAYS_PER_MONTH * MILLISECONDS_PER_DAY),
    },
  });

  const twoFactorUser = await prisma.user.create({
    data: {
      name: "Secure User",
      email: "secure@example.com",
      emailVerified: true,
      role: "user",
      twoFactorEnabled: true,
      firstName: "Secure",
      lastName: "User",
    },
  });

  await Promise.all([
    prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    prisma.account.create({
      data: {
        userId: moderatorUser.id,
        accountId: moderatorUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    prisma.account.create({
      data: {
        userId: regularUser1.id,
        accountId: regularUser1.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    prisma.account.create({
      data: {
        userId: regularUser2.id,
        accountId: regularUser2.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    prisma.account.create({
      data: {
        userId: unverifiedUser.id,
        accountId: unverifiedUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    prisma.account.create({
      data: {
        userId: bannedUser.id,
        accountId: bannedUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    prisma.account.create({
      data: {
        userId: twoFactorUser.id,
        accountId: twoFactorUser.id,
        providerId: "credential",
        password: hashedPassword,
      },
    }),
    // Social account example (Google)
    prisma.account.create({
      data: {
        userId: regularUser1.id,
        accountId: "google-oauth-id-123",
        providerId: "google",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        scope: "openid email profile",
      },
    }),
  ]);

  await prisma.twoFactor.create({
    data: {
      userId: twoFactorUser.id,
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

  const adminWorkspace = await prisma.organization.create({
    data: {
      name: "Admin's Workspace",
      slug: "admin-user",
    },
  });

  const moderatorWorkspace = await prisma.organization.create({
    data: {
      name: "Moderator's Workspace",
      slug: "moderator-user",
    },
  });

  const johnWorkspace = await prisma.organization.create({
    data: {
      name: "John's Workspace",
      slug: "john-doe",
    },
  });

  const janeWorkspace = await prisma.organization.create({
    data: {
      name: "Jane's Workspace",
      slug: "jane-smith",
    },
  });

  const secureWorkspace = await prisma.organization.create({
    data: {
      name: "Secure's Workspace",
      slug: "secure-user",
    },
  });

  const acmeOrg = await prisma.organization.create({
    data: {
      name: "Acme Corporation",
      slug: "acme-corp",
      metadata: JSON.stringify({
        industry: "Technology",
        size: "50-200",
        website: "https://acme.example.com",
      }),
    },
  });

  const startupOrg = await prisma.organization.create({
    data: {
      name: "Startup Labs",
      slug: "startup-labs",
      metadata: JSON.stringify({
        industry: "Software",
        size: "1-10",
        website: "https://startuplabs.example.com",
      }),
    },
  });

  const enterpriseOrg = await prisma.organization.create({
    data: {
      name: "Enterprise Inc",
      slug: "enterprise-inc",
      metadata: JSON.stringify({
        industry: "Finance",
        size: "1000+",
        website: "https://enterprise.example.com",
      }),
    },
  });

  await Promise.all([
    // Default workspace owners
    prisma.member.create({
      data: {
        organizationId: adminWorkspace.id,
        userId: adminUser.id,
        role: "owner",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: moderatorWorkspace.id,
        userId: moderatorUser.id,
        role: "owner",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: johnWorkspace.id,
        userId: regularUser1.id,
        role: "owner",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: janeWorkspace.id,
        userId: regularUser2.id,
        role: "owner",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: secureWorkspace.id,
        userId: twoFactorUser.id,
        role: "owner",
      },
    }),

    // Acme Corp members
    prisma.member.create({
      data: {
        organizationId: acmeOrg.id,
        userId: adminUser.id,
        role: "owner",
        createdAt: historyStart,
      },
    }),
    prisma.member.create({
      data: {
        organizationId: acmeOrg.id,
        userId: regularUser1.id,
        role: "admin",
        createdAt: historyStart,
      },
    }),
    prisma.member.create({
      data: {
        organizationId: acmeOrg.id,
        userId: regularUser2.id,
        role: "member",
        createdAt: historyStart,
      },
    }),

    // Startup Labs members
    prisma.member.create({
      data: {
        organizationId: startupOrg.id,
        userId: regularUser1.id,
        role: "owner",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: startupOrg.id,
        userId: twoFactorUser.id,
        role: "member",
      },
    }),

    // Enterprise Inc members
    prisma.member.create({
      data: {
        organizationId: enterpriseOrg.id,
        userId: moderatorUser.id,
        role: "owner",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: enterpriseOrg.id,
        userId: adminUser.id,
        role: "admin",
      },
    }),
  ]);

  await Promise.all([
    prisma.invitation.create({
      data: {
        organizationId: acmeOrg.id,
        email: "invite1@example.com",
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        inviterId: adminUser.id,
      },
    }),
    prisma.invitation.create({
      data: {
        organizationId: startupOrg.id,
        email: "invite2@example.com",
        role: "admin",
        status: "pending",
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        inviterId: regularUser1.id,
      },
    }),
    prisma.invitation.create({
      data: {
        organizationId: acmeOrg.id,
        email: "expired@example.com",
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() - MILLISECONDS_PER_DAY),
        inviterId: adminUser.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.subscription.create({
      data: {
        plan: PLAN_NAMES.FREE,
        referenceId: regularUser2.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
    }),
    prisma.subscription.create({
      data: {
        plan: PLAN_NAMES.ENTERPRISE,
        referenceId: acmeOrg.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: LIMITS.ENTERPRISE.MAX_MEMBERS,
      },
    }),
    prisma.subscription.create({
      data: {
        plan: PLAN_NAMES.FREE,
        referenceId: enterpriseOrg.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
    }),
    prisma.subscription.create({
      data: {
        plan: PLAN_NAMES.PRO,
        referenceId: startupOrg.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
    }),
    prisma.subscription.create({
      data: {
        plan: PLAN_NAMES.FREE,
        referenceId: unverifiedUser.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
      },
    }),
  ]);

  const foundingDate = daysAgo(now, HISTORY_DAYS + FOUNDING_OFFSET_DAYS);

  await Promise.all([
    prisma.user.updateMany({ data: { createdAt: foundingDate } }),
    prisma.organization.updateMany({ data: { createdAt: foundingDate } }),
  ]);

  await prisma.user.update({
    where: { id: adminUser.id },
    data: { defaultOrganizationId: acmeOrg.id },
  });

  const signupDates = weekdayWeightedDates(
    now,
    HISTORY_DAYS,
    FILLER_USER_COUNT
  );

  const fillerUsers = await Promise.all(
    signupDates.map((createdAt, index) => {
      const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
      const lastName = LAST_NAMES[index % LAST_NAMES.length];

      return prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: `member${index + 1}@example.com`,
          emailVerified: true,
          firstName,
          lastName,
          createdAt,
        },
      });
    })
  );

  const acmeFillers = fillerUsers.filter(
    (_, index) => index % ACME_PICK_EVERY === 0
  );

  await Promise.all(
    acmeFillers.map((user) =>
      prisma.member.create({
        data: {
          organizationId: acmeOrg.id,
          userId: user.id,
          role: "member",
          createdAt: user.createdAt,
        },
      })
    )
  );

  console.log(`Seeded ${fillerUsers.length} users over ${HISTORY_DAYS} days.`);

  await Promise.all([
    prisma.session.create({
      data: {
        userId: adminUser.id,
        token: `session_${adminUser.id}_${Date.now()}`,
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        ipAddress: "192.168.1.1",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    }),
    prisma.session.create({
      data: {
        userId: regularUser1.id,
        token: `session_${regularUser1.id}_${Date.now()}`,
        expiresAt: new Date(Date.now() + DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        ipAddress: "192.168.1.2",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }),
  ]);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
