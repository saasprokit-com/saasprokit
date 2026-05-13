"use client";

import { signOut } from "@repo/auth/client";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import type { ActionErrorMessages } from "@repo/internationalization";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/auth/auth";
import { deleteAccountFormAction } from "../actions";

interface DeleteAccountFormProps {
  errors: ActionErrorMessages;
}

const initialState: ActionResult = { success: false };

export function DeleteAccountForm({ errors }: DeleteAccountFormProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const [state, formAction, isPending] = useActionState(
    deleteAccountFormAction,
    initialState
  );

  // Handle action result
  useEffect(() => {
    if (state === initialState) {
      return;
    }

    if (state.success) {
      toast.success("Your account has been permanently deleted.");

      // CRITICAL: Invalidate session on client side
      signOut().then(() => {
        router.push("/");
      });
    } else if (state.error) {
      toast.error(state.error || errors.deleteAccount);
    }
  }, [state, router, errors]);

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-red-800">
            This action is irreversible. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-red-900 text-sm">Deleting your account will:</p>
          <ul className="list-inside list-disc space-y-2 text-red-900 text-sm">
            <li>Permanently delete all your personal data</li>
            <li>Cancel any active subscriptions</li>
            <li>Remove you from all organizations</li>
            <li>Delete all files and content you created</li>
          </ul>

          <Alert className="border-red-300 bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">No Recovery</AlertTitle>
            <AlertDescription className="text-red-800">
              This action cannot be undone. Deleted accounts cannot be
              recovered.
            </AlertDescription>
          </Alert>

          <Button
            className="w-full"
            onClick={() => setShowDialog(true)}
            variant="destructive"
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setShowDialog} open={showDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete Account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Final Warning</AlertTitle>
              <AlertDescription className="text-red-800">
                Your account and all associated data will be permanently deleted
                immediately.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-2">
              <Checkbox
                checked={acknowledged}
                id="acknowledge"
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
              />
              <label
                className="cursor-pointer text-sm leading-relaxed"
                htmlFor="acknowledge"
              >
                I understand this action is permanent and cannot be undone. I
                want to permanently delete my account.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => setShowDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <form action={formAction}>
              <Button
                disabled={!acknowledged || isPending}
                type="submit"
                variant="destructive"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Account Permanently
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
