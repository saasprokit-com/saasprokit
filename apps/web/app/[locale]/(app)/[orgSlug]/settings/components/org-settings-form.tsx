"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ORG_ROLES, type OrgRoleName } from "@repo/auth/permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { deleteOrganizationAction, updateOrganizationAction } from "../actions";
import { type UpdateOrgFormValues, updateOrgSchema } from "../schemas";
import { LogoUpload } from "./logo-upload";

interface OrgSettingsFormProps {
  canEdit: boolean;
  errors: ActionErrorMessages;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    createdAt: Date;
  };
  userRole: OrgRoleName;
}

export function OrgSettingsForm({
  organization,
  canEdit,
  errors,
  userRole,
}: OrgSettingsFormProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<UpdateOrgFormValues>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const isDirty = form.formState.isDirty;
  const canDelete = userRole === ORG_ROLES.OWNER;

  async function onSubmit(values: UpdateOrgFormValues) {
    const result = await updateOrganizationAction({
      organizationId: organization.id,
      name: values.name,
    });

    if (!result.success) {
      toast.error(result.error || errors.updateOrganization);
      return;
    }

    toast.success("Organization updated successfully");
    form.reset({ name: values.name });
    router.refresh();
  }

  function handleDelete() {
    if (deleteConfirmation !== organization.name) {
      toast.error("Please type the organization name to confirm");
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteOrganizationAction({
        organizationId: organization.id,
      });

      if (!result.success) {
        toast.error(result.error || errors.deleteOrganization);
        return;
      }

      toast.success("Organization deleted successfully");
      router.push("/org");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Branding</CardTitle>
          <CardDescription>
            {canEdit
              ? "Customize your organization's visual identity"
              : "View your organization's branding"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload
            canEdit={canEdit}
            currentLogo={organization.logo}
            errors={errors}
            organizationId={organization.id}
            organizationName={organization.name}
            orgSlug={organization.slug}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            {canEdit
              ? "Update your organization information"
              : "View your organization information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit || isSubmitting}
                        placeholder="Enter organization name"
                      />
                    </FormControl>
                    <FormDescription>
                      This is your organization's display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="font-medium text-muted-foreground text-sm">
                    Slug
                  </span>
                  <p className="mt-1 font-mono text-sm">{organization.slug}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    The slug cannot be changed after creation.
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground text-sm">
                    Created
                  </span>
                  <p className="mt-1 text-sm">
                    {new Date(organization.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-medium text-muted-foreground text-sm">
                  Your Role
                </span>
                <p className="mt-1">
                  <Badge className="capitalize" variant="secondary">
                    {userRole.toLowerCase()}
                  </Badge>
                </p>
              </div>

              {canEdit && (
                <Button disabled={isSubmitting || !isDirty} type="submit">
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              )}

              {!canEdit && (
                <p className="text-muted-foreground text-sm">
                  You need to be an owner or admin to edit organization
                  settings.
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {canDelete && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm">Delete this organization</h4>
              <p className="mt-1 text-muted-foreground text-sm">
                Once deleted, all organization data including members,
                invitations, and settings will be permanently removed. This
                action cannot be undone.
              </p>
            </div>

            <AlertDialog
              onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open) {
                  setDeleteConfirmation("");
                }
              }}
              open={isDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Organization</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <span className="block">
                      This action cannot be undone. This will permanently delete
                      the organization{" "}
                      <span className="font-semibold">{organization.name}</span>{" "}
                      and remove all associated data.
                    </span>
                    <span className="block">
                      Please type{" "}
                      <span className="font-mono font-semibold">
                        {organization.name}
                      </span>{" "}
                      to confirm.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  disabled={isDeleting}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type organization name to confirm"
                  value={deleteConfirmation}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={
                      isDeleting || deleteConfirmation !== organization.name
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete();
                    }}
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Organization
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {!canDelete && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Only the organization owner can delete this organization.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
