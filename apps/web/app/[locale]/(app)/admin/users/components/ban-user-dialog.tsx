"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { initialFormState } from "@/lib/forms";
import { banUserAction } from "../actions";
import type { AdminUserRow } from "../queries";
import { type BanUserInput, banUserSchema } from "../schemas";

interface BanUserDialogProps {
  errors: ActionErrorMessages;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  user: AdminUserRow;
}

export function BanUserDialog({
  user,
  errors,
  open,
  onOpenChange,
}: BanUserDialogProps) {
  const [state, formAction, isPending] = useActionState(
    banUserAction,
    initialFormState
  );

  const form = useForm<BanUserInput>({
    resolver: zodResolver(banUserSchema),
    defaultValues: { userId: user.id },
  });

  useActionFieldErrors(form, state);

  useEffect(() => {
    if (state.status === "success") {
      toast.success("User banned", {
        description: `${user.name || user.email} has been banned and their sessions revoked.`,
      });
      onOpenChange(false);
      form.reset();
    } else if (state.status === "error" && state.error) {
      toast.error(state.error || errors.banUser);
    }
  }, [state, form, errors.banUser, onOpenChange, user.name, user.email]);

  const onSubmit = (values: BanUserInput) => {
    startTransition(() => formAction({ ...values, userId: user.id }));
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Ban user</DialogTitle>
              <DialogDescription>
                Ban {user.name || user.email}. This immediately revokes all of
                their active sessions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="banReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                        placeholder="Why is this account being banned?"
                        ref={field.ref}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="banExpiresInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires in days (optional)</FormLabel>
                    <FormControl>
                      <Input
                        max={365}
                        min={1}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          )
                        }
                        placeholder="Leave empty for a permanent ban"
                        ref={field.ref}
                        type="number"
                        value={field.value ?? ""}
                      />
                    </FormControl>
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
              <Button disabled={isPending} type="submit" variant="destructive">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Banning...
                  </>
                ) : (
                  "Ban user"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
