"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { cn } from "@repo/design-system/lib/utils";

export interface CodePreviewTab {
  id: string;
  label: string;
  html: string;
}

interface CodePreviewProps {
  tabs: CodePreviewTab[];
  defaultTab?: string;
  className?: string;
}

export function CodePreview({ tabs, defaultTab, className }: CodePreviewProps) {
  const initial = defaultTab ?? tabs[0]?.id;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border border-border bg-secondary p-10",
        className
      )}
    >
      <Tabs
        className="flex flex-1 flex-col gap-0 overflow-hidden"
        defaultValue={initial}
      >
        <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-tl-lg rounded-tr-lg rounded-br-none rounded-bl-none border-border border-t border-r border-l bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <TabsTrigger
              className="-mb-px h-full flex-none rounded-none border-0 border-border border-r px-4 py-3 font-mono text-xs data-[state=active]:bg-background data-[state=active]:shadow-none"
              key={tab.id}
              value={tab.id}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            className="m-0 max-h-[500px] flex-1 overflow-auto rounded-none border border-border bg-red-500"
            key={tab.id}
            value={tab.id}
          >
            <div
              className="shiki-preview"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output from a build-time-only Server Component reading repo-controlled files; no user input path exists.
              dangerouslySetInnerHTML={{ __html: tab.html }}
            />
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-center justify-between rounded rounded-br-lg rounded-bl-lg border border-border border-t-0 px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <span>utf-8 · lf</span>
        <span>read-only</span>
      </div>
    </div>
  );
}
