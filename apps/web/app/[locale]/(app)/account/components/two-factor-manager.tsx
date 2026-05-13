"use client";

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
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import type { ActionErrorMessages } from "@repo/internationalization";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { useState, useTransition } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import {
  disable2FAAction,
  enable2FAAction,
  verify2FAAction,
} from "../security/actions";

const TWO_FACTOR_CODE_LENGTH = 6;

interface TwoFactorManagerProps {
  enabled: boolean;
  errors: ActionErrorMessages;
}

type SetupStep = "password" | "verify" | "success";

export function TwoFactorManager({ enabled, errors }: TwoFactorManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("password");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable 2FA state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  const handleEnable2FA = () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    startTransition(async () => {
      const result = await enable2FAAction(password);

      if (!result.success) {
        toast.error(result.error || errors.enable2fa);
        return;
      }

      setTotpURI(result.totpURI);
      setBackupCodes(result.backupCodes);
      setSetupStep("verify");
    });
  };

  const handleVerifyTotp = () => {
    if (!code || code.length !== TWO_FACTOR_CODE_LENGTH) {
      toast.error(`Please enter a valid ${TWO_FACTOR_CODE_LENGTH}-digit code`);
      return;
    }

    startTransition(async () => {
      const result = await verify2FAAction(code);

      if (!result.success) {
        toast.error(result.error || errors.verify2fa);
        return;
      }

      setSetupStep("success");
      toast.success("Two-factor authentication has been enabled");
    });
  };

  const handleDisable2FA = () => {
    if (!disablePassword) {
      toast.error("Please enter your password");
      return;
    }

    startTransition(async () => {
      const result = await disable2FAAction(disablePassword);

      if (!result.success) {
        toast.error(result.error || errors.disable2fa);
        return;
      }

      toast.success("Two-factor authentication has been disabled");
      setShowDisableDialog(false);
      setDisablePassword("");
    });
  };

  const handleOpenDialog = () => {
    setShowDialog(true);
    setSetupStep("password");
    setPassword("");
    setTotpURI(null);
    setCode("");
    setBackupCodes([]);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setSetupStep("password");
    setPassword("");
    setTotpURI(null);
    setCode("");
    setBackupCodes([]);
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

              <div className="space-y-3">
                <p className="font-medium text-sm">Options:</p>
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

              <div className="space-y-4">
                <div>
                  <Label htmlFor="enable-password">Password</Label>
                  <Input
                    autoComplete="current-password"
                    disabled={isPending}
                    id="enable-password"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && password) {
                        handleEnable2FA();
                      }
                    }}
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  disabled={isPending}
                  onClick={() => handleCloseDialog()}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={isPending || !password}
                  onClick={handleEnable2FA}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue
                </Button>
              </DialogFooter>
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

              <div className="space-y-4">
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

                <div>
                  <Label htmlFor="totp-code">Authentication Code</Label>
                  <Input
                    autoComplete="off"
                    disabled={isPending}
                    id="totp-code"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        code.length === TWO_FACTOR_CODE_LENGTH
                      ) {
                        handleVerifyTotp();
                      }
                    }}
                    placeholder="000000"
                    value={code}
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  disabled={isPending}
                  onClick={() => {
                    setSetupStep("password");
                    setTotpURI(null);
                    setPassword("");
                  }}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  disabled={isPending || code.length !== TWO_FACTOR_CODE_LENGTH}
                  onClick={handleVerifyTotp}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify & Enable
                </Button>
              </DialogFooter>
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
            setDisablePassword("");
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

          <div>
            <Label htmlFor="disable-password">Password</Label>
            <Input
              autoComplete="current-password"
              disabled={isPending}
              id="disable-password"
              onChange={(e) => setDisablePassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && disablePassword) {
                  handleDisable2FA();
                }
              }}
              placeholder="Enter your password"
              type="password"
              value={disablePassword}
            />
          </div>

          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => {
                setShowDisableDialog(false);
                setDisablePassword("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || !disablePassword}
              onClick={handleDisable2FA}
              variant="destructive"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
