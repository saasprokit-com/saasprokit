"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2, Shield, User, UserPlus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteMemberAction } from "../actions";
import type { InviteMemberInput } from "../schemas";
import { ROLE_DESCRIPTIONS } from "../utils";

type InviteMemberDialogProps = {
  errors: ActionErrorMessages;
  organizationId: string;
};

export function InviteMemberDialog({
  errors,
  organizationId,
}: InviteMemberDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteMemberInput["role"]>(ORG_ROLES.MEMBER);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email required", {
        description: "Please enter an email address",
      });
      return;
    }

    startTransition(async () => {
      const result = await inviteMemberAction({
        organizationId,
        orgSlug,
        email: email.trim(),
        role,
      });

      if (result.success) {
        toast.success("Invitation sent", {
          description: `Invitation sent to ${email}`,
        });
        setOpen(false);
        setEmail("");
        setRole(ORG_ROLES.MEMBER);
      } else {
        toast.error(errors.inviteMember, {
          description: result.error ?? "Something went wrong",
        });
      }
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 size-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They will receive an
              email with instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                autoComplete="email"
                disabled={isPending}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                type="email"
                value={email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                disabled={isPending}
                onValueChange={(value) =>
                  setRole(value as InviteMemberInput["role"])
                }
                value={role}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ORG_ROLES.ADMIN}>
                    <div className="flex items-center gap-2">
                      <Shield className="size-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value={ORG_ROLES.MEMBER}>
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      Member
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
