import type { Session } from "@repo/auth/client";
import { actionError } from "@/lib/auth/action-error";
import { type ActionResult, getServerSession } from "@/lib/auth/auth";

type SessionGuard<T = void> =
  | { session: Session; error: null }
  | { session: null; error: ActionResult<T> };

export async function verifySession<T = void>(): Promise<SessionGuard<T>> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { session: null, error: await actionError<T>("unauthorized") };
  }
  return { session, error: null };
}
