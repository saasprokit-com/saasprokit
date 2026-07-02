"use client";

import { ORG_ROLES, type OrgRoleName } from "@repo/auth/permissions";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Crown, Shield, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateMemberRoleAction } from "../actions";
import type { UpdateRoleInput } from "../schemas";

interface RoleSelectorProps {
  canUpdateRole: boolean;
  currentRole: OrgRoleName;
  errors: ActionErrorMessages;
  isOwner: boolean;
  isSelf: boolean;
  memberId: string;
  organizationId: string;
}

const roleOptions = [
  { value: ORG_ROLES.ADMIN, label: "Admin", icon: Shield },
  { value: ORG_ROLES.MEMBER, label: "Member", icon: User },
];

function getRoleBadgeVariant(
  role: OrgRoleName
): "default" | "secondary" | "outline" {
  if (role === ORG_ROLES.OWNER) {
    return "default";
  }
  if (role === ORG_ROLES.ADMIN) {
    return "secondary";
  }
  return "outline";
}

function getRoleIcon(role: OrgRoleName) {
  if (role === ORG_ROLES.OWNER) {
    return Crown;
  }
  if (role === ORG_ROLES.ADMIN) {
    return Shield;
  }
  return User;
}

export function RoleSelector({
  memberId,
  errors,
  organizationId,
  currentRole,
  isOwner,
  isSelf,
  canUpdateRole,
}: RoleSelectorProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isPending, startTransition] = useTransition();

  // Show static badge if user can't update roles, is viewing owner, or viewing self
  const showStaticBadge = !canUpdateRole || isOwner || isSelf;

  if (showStaticBadge) {
    const RoleIcon = getRoleIcon(currentRole);
    return (
      <Badge
        className="gap-1 capitalize"
        variant={getRoleBadgeVariant(currentRole)}
      >
        <RoleIcon className="size-3" />
        {currentRole}
      </Badge>
    );
  }

  const handleRoleChange = (newRole: OrgRoleName) => {
    if (newRole === currentRole) {
      return;
    }

    startTransition(async () => {
      const result = await updateMemberRoleAction({
        organizationId,
        orgSlug,
        memberId,
        newRole: newRole as UpdateRoleInput["newRole"],
      });

      if (result.success) {
        toast.success("Role updated", {
          description: `Member role changed to ${newRole}`,
        });
      } else {
        toast.error(errors.updateRole, {
          description: result.error ?? "Something went wrong",
        });
      }
    });
  };

  return (
    <Select
      disabled={isPending}
      onValueChange={(v) => handleRoleChange(v as OrgRoleName)}
      value={currentRole}
    >
      <SelectTrigger className="h-7 w-[100px] text-xs capitalize">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem
              className="capitalize"
              key={option.value}
              value={option.value}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-3" />
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
