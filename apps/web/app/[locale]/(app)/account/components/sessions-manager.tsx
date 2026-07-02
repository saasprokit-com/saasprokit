"use client";

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
import type { ActionErrorMessages } from "@repo/internationalization";
import { formatDistanceToNow } from "date-fns";
import { Loader2, LogOut, Monitor, Smartphone } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { logoutAllOtherSessionsAction, logoutSessionAction } from "../actions";

const MOBILE_DEVICE_PATTERN = /mobile|android|iphone|ipad/i;

interface SessionInfo {
  createdAt: Date;
  id: string;
  ipAddress: string | null;
  updatedAt: Date;
  userAgent: string | null;
}

interface SessionsManagerProps {
  currentSessionId: string;
  errors: ActionErrorMessages;
  sessions: SessionInfo[];
}

export function SessionsManager({
  sessions,
  currentSessionId,
  errors,
}: SessionsManagerProps) {
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [isLoggingOutAll, startLogoutAllTransition] = useTransition();

  const handleLogoutSession = async (sessionId: string) => {
    setPendingSessionId(sessionId);
    const result = await logoutSessionAction(sessionId);

    if (result.success) {
      toast.success("Session logged out successfully");
    } else {
      toast.error(result.error || errors.logoutSession);
    }

    setPendingSessionId(null);
  };

  const handleLogoutAll = () => {
    startLogoutAllTransition(async () => {
      const result = await logoutAllOtherSessionsAction();

      if (result.success) {
        toast.success("All other sessions logged out");
        setShowLogoutAllDialog(false);
      } else {
        toast.error(result.error || errors.logoutAllSessions);
      }
    });
  };

  const isMobile = (userAgent?: string) => {
    if (!userAgent) {
      return false;
    }
    return MOBILE_DEVICE_PATTERN.test(userAgent.toLowerCase());
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions. You can logout from any device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No active sessions
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const isCurrent = session.id === currentSessionId;
                    const isDevice = isMobile(session.userAgent || "");

                    return (
                      <div
                        className="flex items-center justify-between rounded-lg border p-4"
                        key={session.id}
                      >
                        <div className="flex items-center gap-3">
                          {isDevice ? (
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Monitor className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {isDevice ? "Mobile" : "Desktop"}
                              </p>
                              {isCurrent && (
                                <span className="rounded-full bg-green-100 px-2 py-1 font-medium text-green-800 text-xs">
                                  Current
                                </span>
                              )}
                            </div>
                            {session.ipAddress && (
                              <p className="text-muted-foreground text-xs">
                                {session.ipAddress}
                              </p>
                            )}
                            <p className="text-muted-foreground text-xs">
                              Last active{" "}
                              {formatDistanceToNow(
                                new Date(session.updatedAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>

                        {!isCurrent && (
                          <Button
                            disabled={pendingSessionId === session.id}
                            onClick={() => handleLogoutSession(session.id)}
                            size="sm"
                            variant="outline"
                          >
                            {pendingSessionId === session.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <LogOut className="mr-2 h-4 w-4" />
                            )}
                            Logout
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {sessions.length > 1 && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      disabled={sessions.length <= 1}
                      onClick={() => setShowLogoutAllDialog(true)}
                      variant="destructive"
                    >
                      Logout All Other Sessions
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setShowLogoutAllDialog} open={showLogoutAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout All Other Sessions?</DialogTitle>
            <DialogDescription>
              This will logout from all other devices. You will stay logged in
              on this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowLogoutAllDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isLoggingOutAll}
              onClick={handleLogoutAll}
              variant="destructive"
            >
              {isLoggingOutAll && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Logout All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
