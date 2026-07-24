"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import type { ActionErrorMessages } from "@repo/internationalization";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useActionFieldErrors } from "@/hooks/use-action-field-errors";
import { useActionResult } from "@/hooks/use-action-result";
import { initialFormState } from "@/lib/forms";
import { disable2FAAction, enable2FAAction, verify2FAAction } from "../actions";
import {
  TWO_FACTOR_CODE_LENGTH,
  type TwoFactorCodeValues,
  type TwoFactorPasswordValues,
  twoFactorCodeSchema,
  twoFactorPasswordSchema,
} from "../schemas";

interface TwoFactorManagerProps {
  enabled: boolean;
  errors: ActionErrorMessages;
}

type SetupStep = "password" | "verify" | "success";

export function TwoFactorManager({ enabled, errors }: TwoFactorManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("password");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable 2FA state
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const [enableState, enableFormAction, isEnabling] = useActionState(
    enable2FAAction,
    initialFormState
  );
  const [verifyState, verifyFormAction, isVerifying] = useActionState(
    verify2FAAction,
    initialFormState
  );
  const [disableState, disableFormAction, isDisabling] = useActionState(
    disable2FAAction,
    initialFormState
  );

  const isPending = isEnabling || isVerifying || isDisabling;

  const enableForm = useForm<TwoFactorPasswordValues>({
    resolver: zodResolver(twoFactorPasswordSchema),
    defaultValues: { password: "" },
  });
  const verifyForm = useForm<TwoFactorCodeValues>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: "" },
  });
  const disableForm = useForm<TwoFactorPasswordValues>({
    resolver: zodResolver(twoFactorPasswordSchema),
    defaultValues: { password: "" },
  });

  useActionFieldErrors(enableForm, enableState);
  useActionFieldErrors(verifyForm, verifyState);
  useActionFieldErrors(disableForm, disableState);

  const enablePassword = enableForm.watch("password");
  const code = verifyForm.watch("code");
  const disablePassword = disableForm.watch("password");

  useActionResult(enableState, {
    onError: (error) => toast.error(error ?? errors.enable2fa),
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);
      setSetupStep("verify");
    },
  });

  useActionResult(verifyState, {
    onError: (error) => toast.error(error ?? errors.verify2fa),
    onSuccess: () => {
      setSetupStep("success");
      toast.success("Two-factor authentication has been enabled");
    },
  });

  useActionResult(disableState, {
    onError: (error) => toast.error(error ?? errors.disable2fa),
    onSuccess: () => {
      toast.success("Two-factor authentication has been disabled");
      setShowDisableDialog(false);
      disableForm.reset();
    },
  });

  const onEnableSubmit = (values: TwoFactorPasswordValues) => {
    startTransition(() => enableFormAction(values));
  };

  const onVerifySubmit = (values: TwoFactorCodeValues) => {
    startTransition(() => verifyFormAction(values));
  };

  const onDisableSubmit = (values: TwoFactorPasswordValues) => {
    startTransition(() => disableFormAction(values));
  };

  const handleOpenDialog = () => {
    setShowDialog(true);
    setSetupStep("password");
    setTotpURI(null);
    setBackupCodes([]);
    enableForm.reset();
    verifyForm.reset();
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSetupStep("password");
    setTotpURI(null);
    setBackupCodes([]);
    enableForm.reset();
    verifyForm.reset();
  };

  // Extract manual secret from TOTP URI for users who can't scan QR codes
  const getManualSecret = (uri: string) => {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret") ?? "";
    } catch {
      return "";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {enabled ? (
            <>
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Enabled</AlertTitle>
                <AlertDescription className="text-green-800">
                  Two-factor authentication is currently enabled on your
                  account.
                </AlertDescription>
              </Alert>

              <div className="space-x-4">
                <Button
                  disabled={isPending}
                  onClick={handleOpenDialog}
                  variant="outline"
                >
                  Reconfigure 2FA
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() => setShowDisableDialog(true)}
                  variant="destructive"
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900">Not Enabled</AlertTitle>
                <AlertDescription className="text-amber-800">
                  Two-factor authentication is not currently enabled. We
                  recommend enabling it for better security.
                </AlertDescription>
              </Alert>

              <p className="text-muted-foreground text-sm">
                Two-factor authentication adds an extra layer of security by
                requiring a code from your phone in addition to your password
                when signing in.
              </p>

              <Button disabled={isPending} onClick={handleOpenDialog}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable 2FA
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog onOpenChange={handleCloseDialog} open={showDialog}>
        <DialogContent className="max-w-md">
          {setupStep === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  Enter your password to begin setting up 2FA
                </DialogDescription>
              </DialogHeader>

              <Form {...enableForm}>
                <form
                  className="space-y-4"
                  onSubmit={enableForm.handleSubmit(onEnableSubmit)}
                >
                  <FormField
                    control={enableForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="current-password"
                            disabled={isEnabling}
                            placeholder="Enter your password"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      disabled={isEnabling}
                      onClick={() => handleCloseDialog()}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isEnabling || !enablePassword}
                      type="submit"
                    >
                      {isEnabling && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Continue
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}

          {setupStep === "verify" && totpURI && (
            <>
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app, then enter the
                  code
                </DialogDescription>
              </DialogHeader>

              <Form {...verifyForm}>
                <form
                  className="space-y-4"
                  onSubmit={verifyForm.handleSubmit(onVerifySubmit)}
                >
                  <div className="flex justify-center rounded-lg border bg-white p-4">
                    <QRCode size={200} value={totpURI} />
                  </div>

                  <div className="rounded-lg border border-dashed bg-gray-50 p-3 text-center">
                    <p className="mb-1 text-gray-600 text-xs">
                      Or enter this secret manually
                    </p>
                    <p className="select-all font-mono text-gray-700 text-sm">
                      {getManualSecret(totpURI)}
                    </p>
                  </div>

                  <FormField
                    control={verifyForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication Code</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="off"
                            disabled={isVerifying}
                            inputMode="numeric"
                            maxLength={TWO_FACTOR_CODE_LENGTH}
                            placeholder="000000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.replace(/\D/g, ""))
                            }
                          />
                        </FormControl>
                        <p className="mt-1 text-muted-foreground text-xs">
                          Enter the 6-digit code from your authenticator app
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      disabled={isVerifying}
                      onClick={() => {
                        setSetupStep("password");
                        setTotpURI(null);
                        enableForm.reset();
                      }}
                      type="button"
                      variant="outline"
                    >
                      Back
                    </Button>
                    <Button
                      disabled={
                        isVerifying || code.length !== TWO_FACTOR_CODE_LENGTH
                      }
                      type="submit"
                    >
                      {isVerifying && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify & Enable
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}

          {setupStep === "success" && backupCodes.length > 0 && (
            <>
              <DialogHeader>
                <DialogTitle>Backup Codes</DialogTitle>
                <DialogDescription>
                  Save these codes in a safe place. You can use them to access
                  your account if you lose your authenticator app.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Success!</AlertTitle>
                  <AlertDescription className="text-green-800">
                    Two-factor authentication has been enabled
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="mb-2 font-semibold text-gray-700 text-xs">
                    BACKUP CODES
                  </p>
                  <div className="space-y-1">
                    {backupCodes.map((backupCode) => (
                      <p
                        className="font-mono text-gray-600 text-xs"
                        key={backupCode}
                      >
                        {backupCode}
                      </p>
                    ))}
                  </div>
                </div>

                <p className="text-muted-foreground text-xs">
                  Keep these codes safe. Never share them with anyone. Each code
                  can only be used once.
                </p>
              </div>

              <DialogFooter>
                <Button className="w-full" onClick={handleCloseDialog}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => {
          setShowDisableDialog(open);
          if (!open) {
            disableForm.reset();
          }
        }}
        open={showDisableDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm. Your account will be less secure
              without 2FA.
            </DialogDescription>
          </DialogHeader>

          <Form {...disableForm}>
            <form
              className="space-y-4"
              onSubmit={disableForm.handleSubmit(onDisableSubmit)}
            >
              <FormField
                control={disableForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="current-password"
                        disabled={isDisabling}
                        placeholder="Enter your password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  disabled={isDisabling}
                  onClick={() => {
                    setShowDisableDialog(false);
                    disableForm.reset();
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isDisabling || !disablePassword}
                  type="submit"
                  variant="destructive"
                >
                  {isDisabling && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Disable
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
