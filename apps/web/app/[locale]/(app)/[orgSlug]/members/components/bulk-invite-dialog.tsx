"use client";

import { ORG_ROLES } from "@repo/auth/permissions";
import { Badge } from "@repo/design-system/components/ui/badge";
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
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { ActionErrorMessages } from "@repo/internationalization";
import { parseEmailInput } from "@repo/utils/user";
import { Loader2, Shield, User, Users } from "lucide-react";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { bulkInviteAction } from "../actions";
import { type BulkInviteInput, emailSchema } from "../schemas";
import { ROLE_DESCRIPTIONS } from "../utils";

type BulkInviteDialogProps = {
  errors: ActionErrorMessages;
  organizationId: string;
};

function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const email of emails) {
    if (seen.has(email)) {
      continue; // Skip duplicates
    }
    seen.add(email);

    if (emailSchema.safeParse(email).success) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

function handleInviteResult(
  result: Awaited<ReturnType<typeof bulkInviteAction>>,
  onSuccess: () => void,
  errors: ActionErrorMessages
): void {
  if (result.success && result.data) {
    const { invited, skipped } = result.data;

    if (invited > 0) {
      toast.success(`${invited} invitation${invited > 1 ? "s" : ""} sent`, {
        description:
          skipped.length > 0
            ? `${skipped.length} already invited or members`
            : undefined,
      });
    } else if (skipped.length > 0) {
      toast.info("No new invitations sent", {
        description: `${skipped.length} were already invited or members`,
      });
    }

    onSuccess();
  } else {
    toast.error(errors.bulkInvite, {
      description: result.error ?? "Something went wrong",
    });
  }
}

export function BulkInviteDialog({
  errors,
  organizationId,
}: BulkInviteDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState<BulkInviteInput["role"]>(ORG_ROLES.MEMBER);

  const parsedEmails = parseEmailInput(emailInput);
  const { valid, invalid } = validateEmails(parsedEmails);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (valid.length === 0) {
      toast.error("No valid emails", {
        description: "Please enter at least one valid email address",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await bulkInviteAction({
          organizationId,
          orgSlug,
          emails: valid,
          role,
        });

        handleInviteResult(
          result,
          () => {
            setOpen(false);
            setEmailInput("");
            setRole(ORG_ROLES.MEMBER);
          },
          errors
        );
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const resetForm = () => {
    setEmailInput("");
    setRole(ORG_ROLES.MEMBER);
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="mr-2 size-4" />
          Bulk Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Bulk Invite Members</DialogTitle>
            <DialogDescription>
              Invite multiple people at once. Enter email addresses separated by
              commas, newlines, or spaces.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emails">Email addresses</Label>
              <Textarea
                className="min-h-[120px]"
                disabled={isPending}
                id="emails"
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="john@example.com, jane@example.com&#10;mike@example.com"
                value={emailInput}
              />
              <div className="flex items-center gap-2 text-sm">
                {valid.length > 0 && (
                  <Badge variant="secondary">
                    {valid.length} valid email{valid.length > 1 ? "s" : ""}
                  </Badge>
                )}
                {invalid.length > 0 && (
                  <Badge variant="destructive">{invalid.length} invalid</Badge>
                )}
              </div>
              {invalid.length > 0 && (
                <p className="text-destructive text-xs">
                  Invalid: {invalid.join(", ")}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-role">Role for all invitees</Label>
              <Select
                disabled={isPending}
                onValueChange={(value) =>
                  setRole(value as BulkInviteInput["role"])
                }
                value={role}
              >
                <SelectTrigger id="bulk-role">
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
            <Button disabled={isPending || valid.length === 0} type="submit">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send ${valid.length} Invitation${valid.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
