"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { cn } from "@repo/design-system/lib/utils";
import { Link2, Mail, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { orgRoutes } from "@/lib/routes";

interface MembersNavProps {
  activeInviteLinkCount: number;
  memberCount: number;
  orgSlug: string;
  pendingInvitationCount: number;
}

interface NavItem {
  count: number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  showZeroCount: boolean;
}

export function MembersNav({
  orgSlug,
  memberCount,
  pendingInvitationCount,
  activeInviteLinkCount,
}: MembersNavProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      label: "Members",
      href: orgRoutes.members(orgSlug),
      icon: Users,
      count: memberCount,
      showZeroCount: true,
    },
    {
      label: "Pending Invitations",
      href: orgRoutes.membersInvitations(orgSlug),
      icon: Mail,
      count: pendingInvitationCount,
      showZeroCount: false,
    },
    {
      label: "Invite Links",
      href: orgRoutes.membersInviteLinks(orgSlug),
      icon: Link2,
      count: activeInviteLinkCount,
      showZeroCount: false,
    },
  ];

  return (
    <nav className="inline-flex h-auto w-fit flex-wrap items-center justify-center gap-1 rounded-lg bg-muted p-[3px] text-muted-foreground sm:flex-nowrap">
      {items.map((item) => {
        // Match active state: exact match for members root, startsWith for sub-pages
        const isActive =
          item.href === orgRoutes.members(orgSlug)
            ? pathname.endsWith(`/${orgSlug}/members`) ||
              pathname.endsWith(`/${orgSlug}/members/`)
            : pathname.includes(item.href);

        return (
          <Link
            aria-selected={isActive}
            className={cn(
              "inline-flex h-[calc(100%-1px)] flex-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent px-2 py-1 font-medium text-sm transition-[color,box-shadow]",
              "text-foreground dark:text-muted-foreground",
              isActive &&
                "bg-background shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground"
            )}
            href={item.href}
            key={item.href}
            role="tab"
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
            {(item.showZeroCount || item.count > 0) && (
              <Badge className="ml-1" variant="secondary">
                {item.count}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
