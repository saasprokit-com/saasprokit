import type { Session } from "@repo/auth/client";
import { actionError } from "@/lib/auth/action-error";
import { type ActionResult, getServerSession } from "@/lib/auth/auth";

type SessionGuard<T = void> =
  | { session: Session; error: null }
  | { session: null; error: ActionResult<T> };

/**
 * Verify the current session in a server action context.
 * Returns the session on success, or an ActionResult error (no redirect).
 *
 * Usage:
 *   const { session, error } = await verifySession();
 *   if (error) return error;
 *   // session is guaranteed non-null here
 */
export async function verifySession<T = void>(): Promise<SessionGuard<T>> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { session: null, error: await actionError<T>("unauthorized") };
  }
  return { session, error: null };
}
