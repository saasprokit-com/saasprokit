import "@/lib/env";
import "./styles.css";
import { fonts } from "@repo/design-system/lib/fonts";
import { cn } from "@repo/design-system/lib/utils";
import { headers } from "next/headers";
import type { ReactNode } from "react";

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const headersList = await headers();
  const locale = headersList.get("x-next-locale") || "en";

  return (
    <html lang={locale} suppressHydrationWarning>
      {/* `fonts` carries GeistSans.variable and GeistMono.variable, which is
          what defines --font-geist-sans/--font-geist-mono. globals.css maps
          --font-sans/--font-mono onto those, so without this class every
          font-sans and font-mono utility silently falls back to the browser
          default and the Geist dependency never loads. */}
      <body className={cn(fonts, "min-h-screen bg-background")}>
        {children}
      </body>
    </html>
  );
}
