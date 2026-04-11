import {
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DAYS_PER_YEAR,
  MILLISECONDS_PER_DAY,
} from "@repo/utils/date";
import { PLAN_NAMES, SUBSCRIPTION_STATUS } from "@repo/utils/payment";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../generated/client/client";

if (process.env.NODE_ENV === "production") {
  // biome-ignore lint/suspicious/noConsole: seed script output
  console.error("Seed script cannot run in production environment.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // Clean all tables in FK-safe order (leaf → root)
  // Team tables may not exist yet if schema hasn't been fully pushed
  await prisma.teamMember.deleteMany().catch((error: unknown) => {
    // biome-ignore lint/suspicious/noConsole: seed script output
    console.warn(
      "Skipping teamMember cleanup:",
      error instanceof Error ? error.message : error
    );
  });
  await prisma.team.deleteMany().catch((error: unknown) => {
    // biome-ignore lint/suspicious/noConsole: seed script output
    console.warn(
      "Skipping team cleanup:",
      error instanceof Error ? error.message : error
    );
  });
  await prisma.inviteLink.deleteMany().catch((error: unknown) => {
    // biome-ignore lint/suspicious/noConsole: seed script output
    console.warn(
      "Skipping inviteLink cleanup:",
      error instanceof Error ? error.message : error
    );
  });
  await prisma.file.deleteMany();
  await prisma.auditLog.deleteMany();
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
      },
    }),
    prisma.member.create({
      data: {
        organizationId: acmeOrg.id,
        userId: regularUser1.id,
        role: "admin",
      },
    }),
    prisma.member.create({
      data: {
        organizationId: acmeOrg.id,
        userId: regularUser2.id,
        role: "member",
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
        plan: PLAN_NAMES.FREE,
        referenceId: acmeOrg.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + DAYS_PER_YEAR * MILLISECONDS_PER_DAY),
        seats: 1,
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
        plan: PLAN_NAMES.FREE,
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
    // biome-ignore lint/suspicious/noConsole: seed script output
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
