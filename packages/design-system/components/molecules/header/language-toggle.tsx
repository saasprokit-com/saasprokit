"use client";

import { cn } from "@repo/design-system/lib/utils";
import { Check, Languages } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

export interface LanguageOption {
  value: string;
  label: string;
}

export interface LanguageToggleProps {
  languages: readonly LanguageOption[];
  defaultLocale: string;
  className?: string;
}

export function LanguageToggle({
  languages,
  defaultLocale,
  className,
}: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const current =
    typeof params.locale === "string" ? params.locale : defaultLocale;

  const changeLocale = (next: string) => {
    if (next === current) {
      return;
    }
    // Strip any existing locale prefix to get the bare path.
    const segments = pathname.split("/");
    const hasLocalePrefix = languages.some((lang) => lang.value === segments[1]);
    const rest = hasLocalePrefix ? `/${segments.slice(2).join("/")}` : pathname;

    // Always navigate to the explicitly-prefixed path, even for the default locale.
    // Under next-international's rewriteDefault, the middleware strips the default
    // prefix back to "/" and updates the Next-Locale cookie in that same redirect.
    // Pushing a bare "/" would instead be resolved from the stale cookie and bounce
    // back to the previous locale.
    router.push(`/${next}${rest === "/" ? "" : rest}`);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Change language"
          className={cn("shrink-0 text-foreground", className)}
          size="icon"
          variant="ghost"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(({ value, label }) => (
          <DropdownMenuItem
            className="justify-between gap-6"
            key={value}
            onClick={() => changeLocale(value)}
          >
            {label}
            {value === current && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
