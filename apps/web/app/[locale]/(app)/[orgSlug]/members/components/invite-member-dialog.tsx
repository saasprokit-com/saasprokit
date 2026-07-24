"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
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
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { inviteMemberAction } from "../actions";
import {
  type InviteMemberFormValues,
  inviteMemberFormSchema,
} from "../schemas";
import { ROLE_DESCRIPTIONS } from "../utils";

interface InviteMemberDialogProps {
  errors: ActionErrorMessages;
  organizationId: string;
}

export function InviteMemberDialog({
  errors,
  organizationId,
}: InviteMemberDialogProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [open, setOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    inviteMemberAction,
    initialFormState
  );

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberFormSchema),
    defaultValues: {
      email: "",
      role: ORG_ROLES.MEMBER,
    },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Invitation sent", {
        description: `Invitation sent to ${form.getValues("email")}`,
      });
      setOpen(false);
      form.reset();
    } else if (state.status === "error" && state.error) {
      toast.error(errors.inviteMember, {
        description: state.error,
      });
    }
  }, [state, form, errors]);

  const onSubmit = (values: InviteMemberFormValues) => {
    startTransition(() => formAction({ ...values, organizationId, orgSlug }));
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization. They will receive
                an email with instructions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="email"
                        disabled={isPending}
                        placeholder="colleague@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
