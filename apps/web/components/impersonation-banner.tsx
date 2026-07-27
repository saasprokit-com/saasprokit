"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { stopImpersonatingAction } from "@/lib/auth/actions";
import { adminRoutes } from "@/lib/routes";

interface ImpersonationBannerProps {
  email: string;
  name: string;
}

export function ImpersonationBanner({ name, email }: ImpersonationBannerProps) {
  const params = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();

  const handleExit = () => {
    startTransition(async () => {
      const result = await stopImpersonatingAction();
      if (result.success) {
        window.location.assign(`/${params.locale}${adminRoutes.users()}`);
        return;
      }
      toast.error(result.error ?? "Failed to exit impersonation");
    });
  };

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-amber-950 text-sm">
      <TriangleAlert className="h-4 w-4 shrink-0" />
      <span>
        Impersonating <strong>{name}</strong> ({email}) — session ends
        automatically after 1 hour
      </span>
      <Button
        className="h-7 border-amber-950/30 bg-amber-100 text-amber-950 hover:bg-amber-50"
        disabled={isPending}
        onClick={handleExit}
        size="sm"
        variant="outline"
      >
        {isPending ? "Exiting…" : "Exit impersonation"}
      </Button>
    </div>
  );
}
