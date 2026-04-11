"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { ArrowLeft, Ban, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { accountRoutes } from "@/lib/routes";

type UpgradePromptProps = {
  reason?: string;
  showUpgrade?: boolean;
};

export function UpgradePrompt({
  reason,
  showUpgrade = true,
}: UpgradePromptProps) {
  const { locale } = useParams<{ locale: string }>();

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {showUpgrade ? (
            <Sparkles className="h-6 w-6 text-primary" />
          ) : (
            <Ban className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <CardTitle>
          {showUpgrade ? "Upgrade Required" : "Organization Limit Reached"}
        </CardTitle>
        <CardDescription>
          {reason || "You need a paid plan to create workspaces."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showUpgrade && (
          <Button asChild>
            <Link href={`/${locale}/org`}>Upgrade Plan</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/${locale}${accountRoutes.profile()}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
