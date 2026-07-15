import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";

const NAV_ITEM_KEYS = Array.from({ length: 5 }, (_, i) => `nav-${i}`);

/**
 * Fallback for the authenticated app shell, rendered while the org/account
 * layouts resolve their session and membership queries. Reuses the real sidebar
 * primitives so the chrome does not shift when the actual shell streams in.
 *
 * Deliberately avoids SidebarMenuSkeleton: it randomizes its width on mount,
 * which mismatches between the streamed and hydrated markup.
 */
export function AppShellSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <div className="space-y-1 p-2">
            {NAV_ITEM_KEYS.map((key) => (
              <div className="flex h-8 items-center gap-2 px-2" key={key}>
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="mx-2 h-4 w-px" />
          <Skeleton className="h-4 w-40" />
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
