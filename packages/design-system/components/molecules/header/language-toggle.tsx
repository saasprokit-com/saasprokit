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
    // Non-default locales carry a leading /{locale} segment; the default has none.
    const segments = pathname.split("/");
    const hasLocalePrefix = languages.some((lang) => lang.value === segments[1]);
    const rest = hasLocalePrefix ? `/${segments.slice(2).join("/")}` : pathname;
    const target =
      next === defaultLocale ? rest : `/${next}${rest === "/" ? "" : rest}`;

    router.push(target);
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
