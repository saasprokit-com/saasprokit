import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { createRequestLogger } from "@repo/logger/server";
import { MILLISECONDS_PER_SECOND, SECONDS_PER_MINUTE } from "@repo/utils/date";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Debounce interval: 5 minutes
const MINUTES_PER_INTERVAL = 5;
const DEBOUNCE_INTERVAL_MS =
  MINUTES_PER_INTERVAL * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

export async function POST() {
  const logger = createRequestLogger({
    endpoint: "/api/user/activity",
    method: "POST",
  });

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      logger.debug("Unauthorized activity update attempt");
      return new NextResponse(null, { status: 401 });
    }

    const userLogger = logger.child({ userId: session.user.id });
    const userId = session.user.id;
    const now = new Date();
    const debounceTime = new Date(now.getTime() - DEBOUNCE_INTERVAL_MS);

    // SECURITY: Race condition prevention
    // Use atomic database-level update that only succeeds if debounce interval has passed
    // This prevents concurrent requests from both performing unnecessary updates
    const result = await database.user.updateMany({
      where: {
        id: userId,
        OR: [
          { lastActiveAt: null }, // Never updated before
          { lastActiveAt: { lt: debounceTime } }, // Debounce interval exceeded
        ],
      },
      data: { lastActiveAt: now },
    });

    if (result.count > 0) {
      userLogger.debug(
        { lastActiveAt: now.toISOString() },
        "User activity updated"
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error(
      {
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "Failed to update user activity"
    );
    return new NextResponse(null, { status: 500 });
  }
}
