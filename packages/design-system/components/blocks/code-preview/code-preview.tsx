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
        className="flex flex-1 flex-col overflow-hidden border border-border"
        defaultValue={initial}
      >
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-border border-b bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              className="-mb-px flex-none rounded-none border-transparent border-b-2 px-4 py-3 font-mono text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              key={tab.id}
              value={tab.id}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            className="m-0 max-h-[500px] flex-1 overflow-auto bg-white"
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

      {/* <div className="flex items-center justify-between border-border border-t px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <span>utf-8 · lf</span>
        <span>read-only</span>
      </div> */}
    </div>
  );
}
