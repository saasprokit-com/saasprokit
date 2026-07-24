"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
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
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
import { initialFormState } from "@/lib/forms";
import { bulkInviteAction } from "../actions";
import {
  type BulkInviteFormValues,
  bulkInviteFormSchema,
  validateEmails,
} from "../schemas";
import { ROLE_DESCRIPTIONS } from "../utils";

interface BulkInviteDialogProps {
  errors: ActionErrorMessages;
  organizationId: string;
}

export function BulkInviteDialog({
  errors,
  organizationId,
}: BulkInviteDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [open, setOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    bulkInviteAction,
    initialFormState
  );

  const form = useForm<BulkInviteFormValues>({
    resolver: zodResolver(bulkInviteFormSchema),
    defaultValues: {
      emails: "",
      role: ORG_ROLES.MEMBER,
    },
  });

  useActionFieldErrors(form, state);

  const { valid, invalid } = validateEmails(
    parseEmailInput(form.watch("emails"))
  );

  useActionResult(state, {
    onError: (error) => toast.error(errors.bulkInvite, { description: error }),
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      const { invited, skipped } = data;

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

      setOpen(false);
      form.reset();
    },
  });

  const onSubmit = (values: BulkInviteFormValues) => {
    if (valid.length === 0) {
      toast.error("No valid emails", {
        description: "Please enter at least one valid email address",
      });
      return;
    }

    startTransition(() => formAction({ ...values, organizationId, orgSlug }));
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          form.reset();
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Bulk Invite Members</DialogTitle>
              <DialogDescription>
                Invite multiple people at once. Enter email addresses separated
                by commas, newlines, or spaces.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email addresses</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[120px]"
                        disabled={isPending}
                        placeholder="john@example.com, jane@example.com&#10;mike@example.com"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2 text-sm">
                      {valid.length > 0 && (
                        <Badge variant="secondary">
                          {valid.length} valid email
                          {valid.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {invalid.length > 0 && (
                        <Badge variant="destructive">
                          {invalid.length} invalid
                        </Badge>
                      )}
                    </div>
                    {invalid.length > 0 && (
                      <p className="text-destructive text-xs">
                        Invalid: {invalid.join(", ")}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role for all invitees</FormLabel>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
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
                      {ROLE_DESCRIPTIONS[field.value]}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  `Send ${valid.length} Invitation${valid.length === 1 ? "" : "s"}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
