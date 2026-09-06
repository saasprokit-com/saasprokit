import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DOCS_PATH, DOCS_URL } from "@/lib/site";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(DOCS_URL),
  title: {
    default: "saasprokit documentation",
    template: "%s | saasprokit",
  },
  description:
    "Architecture and setup for the saasprokit boilerplate — auth, billing, email, and deployment.",
  // Next resolves icons without metadataBase and without the basePath.
  icons: { icon: `${DOCS_PATH}/icon.svg` },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html className={inter.className} lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* The search client defaults to /api/search, which the basePath does
            not reach — that path belongs to the marketing site worker. */}
        <RootProvider search={{ options: { api: `${DOCS_PATH}/api/search` } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
