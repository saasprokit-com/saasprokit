"use client";

import { GoogleIcon } from "@repo/design-system/components/icons/google";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Github } from "lucide-react";
import type * as React from "react";

export type SocialProvider = "google" | "github";

export type SocialProvidersProps = {
  providers: SocialProvider[];
  onProviderClick: (provider: SocialProvider) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
};

const providerConfig: Record<
  SocialProvider,
  { label: string; icon: React.ReactNode }
> = {
  google: {
    label: "Google",
    icon: <GoogleIcon className="size-4" />,
  },
  github: {
    label: "GitHub",
    icon: <Github className="size-4" />,
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
