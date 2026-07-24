"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ORG_ROLES } from "@repo/auth/permissions";
import { DataTableFacetedFilter } from "@repo/design-system/components/data-table/faceted-filter";
import { DataTableViewOptions } from "@repo/design-system/components/data-table/view-options";
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
import { Copy, Plus, X } from "lucide-react";
import { useParams } from "next/navigation";
import {
  type ComponentType,
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
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
  const isFiltered = table.getState().columnFilters.length > 0;

  // Search input
  const tokenColumn = table.getColumn("token");
  const urlSearchValue = (tokenColumn?.getFilterValue() as string) ?? "";
  const [searchInput, setSearchInput] = useState(urlSearchValue);

  useEffect(() => {
    setSearchInput(urlSearchValue);
  }, [urlSearchValue]);

  const debouncedSetFilter = useDebouncedCallback((value: string) => {
    tokenColumn?.setFilterValue(value || undefined);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSetFilter(value);
  };

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

  useEffect(() => {
    if (state.status === "success" && state.data) {
      setNewLinkUrl(state.data.url);
      toast.success("Invite link created");
    } else if (state.status === "error" && state.error) {
      toast.error(state.error || errors.createInviteLink);
    }
  }, [state, errors.createInviteLink]);

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
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          className="h-8 w-[150px] lg:w-[250px]"
          onChange={handleSearchChange}
          placeholder="Filter invite links..."
          value={searchInput}
        />
        {filters.map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column) {
            return null;
          }
          return (
            <DataTableFacetedFilter
              column={column}
              key={filter.columnId}
              options={filter.options}
              title={filter.title}
            />
          );
        })}
        {isFiltered && (
          <Button
            onClick={() => {
              table.resetColumnFilters();
              setSearchInput("");
            }}
            size="sm"
            variant="ghost"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
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
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
