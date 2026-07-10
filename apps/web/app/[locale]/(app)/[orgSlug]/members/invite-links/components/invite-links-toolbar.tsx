"use client";

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
import { MAX_INVITE_LINK_USES } from "@repo/utils/organization";
import type { Table } from "@tanstack/react-table";
import { Copy, Plus, X } from "lucide-react";
import { useParams } from "next/navigation";
import { type ComponentType, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { SEARCH_DEBOUNCE_MS } from "../../utils";
import { createInviteLinkAction } from "../actions";
import type { InviteLink } from "../queries";
import type { CreateInviteLinkInput } from "../schemas";
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
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState<string | null>(null);
  const [role, setRole] = useState<CreateInviteLinkInput["role"]>(
    ORG_ROLES.MEMBER
  );
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [maxUses, setMaxUses] = useState("");

  const resetForm = () => {
    setRole(ORG_ROLES.MEMBER);
    setExpiresInDays("7");
    setMaxUses("");
    setNewLinkUrl(null);
  };

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const result = await createInviteLinkAction({
          organizationId,
          orgSlug,
          role,
          expiresInDays: Number.parseInt(expiresInDays, 10),
          maxUses: maxUses ? Number.parseInt(maxUses, 10) : undefined,
        });
        if (result.success && result.data) {
          setNewLinkUrl(result.data.url);
          toast.success("Invite link created");
        } else {
          toast.error(result.error || errors.createInviteLink);
        }
      } catch {
        toast.error("An error occurred");
      }
    });
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
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        onValueChange={(v) =>
                          setRole(v as CreateInviteLinkInput["role"])
                        }
                        value={role}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ORG_ROLES.MEMBER}>
                            Member
                          </SelectItem>
                          <SelectItem value={ORG_ROLES.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Expires in</Label>
                      <Select
                        onValueChange={setExpiresInDays}
                        value={expiresInDays}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max uses (optional)</Label>
                      <Input
                        max={MAX_INVITE_LINK_USES}
                        min="1"
                        onChange={(e) => setMaxUses(e.target.value)}
                        placeholder="Unlimited"
                        type="number"
                        value={maxUses}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setCreateOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button disabled={isPending} onClick={handleCreate}>
                      {isPending ? "Creating..." : "Create Link"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
