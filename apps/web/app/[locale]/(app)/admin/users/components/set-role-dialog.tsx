"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ADMIN_ROLES } from "@repo/auth/permissions";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2, Shield, ShieldCheck, User } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { setUserRoleAction } from "../actions";
import type { AdminUserRow } from "../queries";
import { type SetUserRoleInput, setUserRoleSchema } from "../schemas";

interface SetRoleDialogProps {
  errors: ActionErrorMessages;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: AdminUserRow;
}

const roleOptions = [
  { value: ADMIN_ROLES.ADMIN, label: "Admin", icon: ShieldCheck },
  { value: ADMIN_ROLES.MODERATOR, label: "Moderator", icon: Shield },
  { value: ADMIN_ROLES.USER, label: "User", icon: User },
];

function normalizeRole(role: string | null): SetUserRoleInput["role"] {
  if (role?.includes(ADMIN_ROLES.ADMIN)) {
    return ADMIN_ROLES.ADMIN;
  }
  if (role?.includes(ADMIN_ROLES.MODERATOR)) {
    return ADMIN_ROLES.MODERATOR;
  }
  return ADMIN_ROLES.USER;
}

export function SetRoleDialog({
  user,
  errors,
  open,
  onOpenChange,
}: SetRoleDialogProps) {
  const [state, formAction, isPending] = useActionState(
    setUserRoleAction,
    initialFormState
  );

  const form = useForm<SetUserRoleInput>({
    resolver: zodResolver(setUserRoleSchema),
    defaultValues: { userId: user.id, role: normalizeRole(user.role) },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Role updated", {
        description: `${user.name || user.email} is now ${form.getValues("role")}`,
      });
      onOpenChange(false);
    } else if (state.status === "error" && state.error) {
      toast.error(state.error || errors.updateRole);
    }
  }, [state, form, errors.updateRole, onOpenChange, user.name, user.email]);

  const onSubmit = (values: SetUserRoleInput) => {
    startTransition(() => formAction({ ...values, userId: user.id }));
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Set role</DialogTitle>
              <DialogDescription>
                Change the platform role for {user.name || user.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="size-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save role"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
