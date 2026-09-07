"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableToolbar } from "@repo/design-system/components/data-table/toolbar";
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
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import type { ActionErrorMessages } from "@repo/internationalization";
import {
  DEFAULT_INVITE_LINK_DAYS,
  MAX_INVITE_LINK_USES,
} from "@repo/utils/organization";
import type { Table } from "@tanstack/react-table";
import { Copy, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import {
  type ComponentType,
  startTransition,
  useActionState,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
import { initialFormState } from "@/lib/forms";
import { SEARCH_DEBOUNCE_MS } from "../../utils";
import { createInviteLinkAction } from "../actions";
import type { InviteLink } from "../queries";
import {
  type CreateInviteLinkFormValues,
  createInviteLinkFormSchema,
} from "../schemas";
import { RevokeInviteLinksDialog } from "./revoke-invite-links-dialog";

interface InviteLinksToolbarProps {
  canManage: boolean;
  errors: ActionErrorMessages;
  filters?: {
    columnId: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: ComponentType<{ className?: string }>;
    }[];
  }[];
  organizationId: string;
  table: Table<InviteLink>;
}

export function InviteLinksToolbar({
  table,
  errors,
  organizationId,
  canManage,
  filters = [],
}: InviteLinksToolbarProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  // Create link dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    createInviteLinkAction,
    initialFormState
  );

  const form = useForm<CreateInviteLinkFormValues>({
    resolver: zodResolver(createInviteLinkFormSchema),
    defaultValues: {
      role: ORG_ROLES.MEMBER,
      expiresInDays: DEFAULT_INVITE_LINK_DAYS,
    },
  });

  useActionFieldErrors(form, state);

  useActionResult(state, {
    onError: (error) => toast.error(error ?? errors.createInviteLink),
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      setNewLinkUrl(data.url);
      toast.success("Invite link created");
    },
  });

  const resetForm = () => {
    form.reset();
    setNewLinkUrl(null);
  };

  const onSubmit = (values: CreateInviteLinkFormValues) => {
    startTransition(() => formAction({ ...values, organizationId, orgSlug }));
  };

  // Get selected active links for bulk revoke
  const selectedLinks = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)
    .filter((link) => link.isActive);

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  return (
    <DataTableToolbar
      actions={
        <>
          {canManage && selectedLinks.length > 0 && (
            <RevokeInviteLinksDialog
              errors={errors}
              onSuccess={handleClearSelection}
              organizationId={organizationId}
              selectedLinks={selectedLinks}
            />
          )}
          {canManage && (
            <Dialog
              onOpenChange={(open) => {
                setCreateOpen(open);
                if (!open) {
                  resetForm();
                }
              }}
              open={createOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invite Link</DialogTitle>
                  <DialogDescription>
                    Create a shareable link that anyone can use to join your
                    organization.
                  </DialogDescription>
                </DialogHeader>

                {newLinkUrl ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your invite link</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={newLinkUrl} />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(newLinkUrl);
                            toast.success("Copied!");
                          }}
                          size="icon"
                          variant="outline"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setCreateOpen(false)}>Done</Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <Form {...form}>
                    <form
                      className="space-y-4"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
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
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={ORG_ROLES.MEMBER}>
                                  Member
                                </SelectItem>
                                <SelectItem value={ORG_ROLES.ADMIN}>
                                  Admin
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiresInDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expires in</FormLabel>
                            <Select
                              disabled={isPending}
                              onValueChange={(v) =>
                                field.onChange(Number.parseInt(v, 10))
                              }
                              value={String(field.value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 day</SelectItem>
                                <SelectItem value="7">7 days</SelectItem>
                                <SelectItem value="14">14 days</SelectItem>
                                <SelectItem value="30">30 days</SelectItem>
                                <SelectItem value="90">90 days</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max uses (optional)</FormLabel>
                            <FormControl>
                              <Input
                                disabled={isPending}
                                max={MAX_INVITE_LINK_USES}
                                min="1"
                                name={field.name}
                                onBlur={field.onBlur}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                placeholder="Unlimited"
                                ref={field.ref}
                                type="number"
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          onClick={() => setCreateOpen(false)}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button disabled={isPending} type="submit">
                          {isPending ? "Creating..." : "Create Link"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          )}
        </>
      }
      filters={filters}
      searchDebounceMs={SEARCH_DEBOUNCE_MS}
      searchKey="token"
      searchPlaceholder="Filter invite links..."
      table={table}
    />
  );
}
