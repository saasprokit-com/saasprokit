"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ORG_ROLES, type OrgRoleName } from "@repo/auth/permissions";
import {
  AlertDialog,
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
import { formatDate } from "@repo/design-system/lib/date";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
import type { ActionResult } from "@/lib/auth/auth";
import { initialFormState } from "@/lib/forms";
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
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [updateState, updateFormAction, isSaving] = useActionState(
    updateOrganizationAction,
    initialFormState
  );

  const boundDeleteAction = deleteOrganizationAction.bind(null, {
    organizationId: organization.id,
  });

  const [deleteState, deleteFormAction, isDeleting] = useActionState<
    ActionResult | null,
    FormData
  >(boundDeleteAction, null);

  const form = useForm<UpdateOrgFormValues>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  useActionFieldErrors(form, updateState);

  useActionResult(updateState, {
    onError: (error) => toast.error(error ?? errors.updateOrganization),
    onSuccess: () => {
      toast.success("Organization updated successfully");
      // Re-baseline defaults on the saved name so isDirty gates the button again.
      form.reset({ name: form.getValues("name") });
    },
  });

  useActionResult(deleteState, {
    onError: (error) => toast.error(error ?? errors.deleteOrganization),
    onSuccess: () => {
      toast.success("Organization deleted successfully");
      router.push("/org");
    },
  });

  const isDirty = form.formState.isDirty;
  const canDelete = userRole === ORG_ROLES.OWNER;

  const onSubmit = (values: UpdateOrgFormValues) => {
    startTransition(() =>
      updateFormAction({ ...values, organizationId: organization.id })
    );
  };

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
                        disabled={!canEdit || isSaving}
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
                    {formatDate(organization.createdAt)}
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
                <Button disabled={isSaving || !isDirty} type="submit">
                  {isSaving && (
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
                  <form action={deleteFormAction}>
                    <Button
                      disabled={
                        isDeleting || deleteConfirmation !== organization.name
                      }
                      type="submit"
                      variant="destructive"
                    >
                      {isDeleting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete Organization
                    </Button>
                  </form>
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
