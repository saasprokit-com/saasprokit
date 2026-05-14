import {
  UserMenu,
  type UserMenuUser,
} from "@repo/design-system/components/molecules/header/user-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import Link from "next/link";
import { PAGE_ROUTES } from "@/lib/routes";

interface HeaderUserMenuProps {
  user: UserMenuUser | null | undefined;
}

function getInitials(name?: string | null): string {
  if (!name) {
    return "U";
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  if (!user) {
    return <UserMenu user={null} />;
  }

  return (
    <Link
      aria-label="Go to dashboard"
      className="rounded-full transition-opacity hover:opacity-80"
      href={PAGE_ROUTES.ORG}
    >
      <Avatar className="size-8">
        <AvatarImage alt={user.name || "User"} src={user.image || undefined} />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
