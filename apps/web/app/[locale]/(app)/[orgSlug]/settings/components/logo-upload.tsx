"use client";

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
import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { Building2, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  removeOrganizationLogoAction,
  revalidateOrgSettingsAction,
} from "../actions";

interface LogoUploadProps {
  canEdit: boolean;
  currentLogo: string | null;
  errors: ActionErrorMessages;
  organizationId: string;
  organizationName: string;
  orgSlug: string;
}

// File size constants
const BYTES_PER_KILOBYTE = 1024;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE =
  MAX_FILE_SIZE_MB * BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateFileInput(file: File): {
  valid: boolean;
  errorMessage?: string;
} {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      errorMessage: "Please upload a JPEG, PNG, WebP, or GIF image.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      errorMessage: "Please upload an image smaller than 5MB.",
    };
  }

  return { valid: true };
}

export function LogoUpload({
  organizationId,
  organizationName,
  orgSlug,
  currentLogo,
  canEdit,
  errors,
}: LogoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file
    const validation = validateFileInput(file);
    if (!validation.valid) {
      toast.error("Invalid file type", {
        description: validation.errorMessage,
      });
      return;
    }

    startUploadTransition(async () => {
      try {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "org-logo");
        formData.append("organizationId", organizationId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        toast.success("Logo updated successfully");
        setPreviewUrl(result.file.publicUrl);
        await revalidateOrgSettingsAction({ orgSlug });
        router.refresh();
      } catch (error) {
        toast.error(errors.uploadLogo, {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
        // Revert preview on error
        setPreviewUrl(currentLogo);
      } finally {
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    });
  };

  const handleRemove = () => {
    startRemoveTransition(async () => {
      try {
        const result = await removeOrganizationLogoAction({ organizationId });

        if (result.success) {
          toast.success("Logo removed");
          setPreviewUrl(null);
          await revalidateOrgSettingsAction({ orgSlug });
          router.refresh();
        } else {
          toast.error(result.error || errors.removeLogo);
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-start gap-6">
      {/* Logo preview */}
      <div className="relative">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/50">
          {previewUrl ? (
            <Image
              alt={organizationName}
              className="h-full w-full object-cover"
              fill
              sizes="96px"
              src={previewUrl}
            />
          ) : (
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
          )}
        </div>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Upload controls */}
      <div className="flex-1 space-y-3">
        <div>
          <h4 className="font-medium text-sm">Organization Logo</h4>
          <p className="text-muted-foreground text-sm">
            Upload a logo for your organization. Recommended size is 256x256px.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <input
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              disabled={isUploading}
              onChange={handleFileSelect}
              ref={fileInputRef}
              type="file"
            />

            <Button
              disabled={isUploading || isRemoving}
              onClick={triggerFileSelect}
              size="sm"
              variant="outline"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {previewUrl ? "Change Logo" : "Upload Logo"}
            </Button>

            {previewUrl && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isUploading || isRemoving}
                    size="sm"
                    variant="ghost"
                  >
                    {isRemoving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Logo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove the organization logo?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove}>
                      Remove Logo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {!canEdit && (
          <p className="text-muted-foreground text-sm">
            You need to be an owner or admin to change the logo.
          </p>
        )}

        <p className="text-muted-foreground text-xs">
          Accepted formats: JPEG, PNG, WebP, GIF. Max size: 5MB.
        </p>
      </div>
    </div>
  );
}
