"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { ActionErrorMessages } from "@repo/internationalization";
import { ShieldOff } from "lucide-react";
import { useState } from "react";

import { RevokeSessionsDialog } from "./revoke-sessions-dialog";

interface RevokeSessionsButtonProps {
  errors: ActionErrorMessages;
  user: { id: string; name: string; email: string };
}

export function RevokeSessionsButton({
  user,
  errors,
}: RevokeSessionsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        <ShieldOff className="mr-2 size-4" />
        Revoke all sessions
      </Button>
      <RevokeSessionsDialog
        errors={errors}
        onOpenChange={setOpen}
        open={open}
        user={user}
      />
    </>
  );
}
