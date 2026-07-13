"use client";

import GoogleIcon from "@repo/design-system/components/icons/google";
import Github from "@repo/design-system/components/icons/github";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import type * as React from "react";

export type SocialProvider = "google" | "github";

export interface SocialProvidersProps {
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onProviderClick: (provider: SocialProvider) => void;
  providers: SocialProvider[];
}

const providerConfig: Record<
  SocialProvider,
  { label: string; icon: React.ReactNode }
> = {
  google: {
    label: "Google",
    icon: <GoogleIcon />,
  },
  github: {
    label: "GitHub",
    icon: <Github />,
  },
};

export function SocialProviders({
  providers,
  onProviderClick,
  isLoading = false,
  disabled = false,
  className,
}: SocialProvidersProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      {providers.map((provider) => {
        const config = providerConfig[provider];
        return (
          <Button
            className="w-full"
            disabled={isLoading || disabled}
            key={provider}
            onClick={() => onProviderClick(provider)}
            type="button"
            variant="outline"
          >
            {config.icon}
            <span>Continue with {config.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
