"use client";

import { SectionHeading } from "@repo/design-system/components/blocks/section-heading/section-heading";
import { StyleConfigurator } from "@repo/design-system/components/blocks/style-configurator/style-configurator";
import { Button } from "@repo/design-system/components/ui/button";

export function ConfigureBuild() {
  return (
    <section
      className="border-border border-b bg-muted/50 px-6 py-20 sm:px-10"
      id="customize"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading subtitle="preview updates live · applies to this page">
          Configure your build.
        </SectionHeading>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Live Preview */}
          <div className="flex flex-col gap-6 border border-border bg-card p-8">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
              preview
            </div>
            <h3
              className="font-semibold text-2xl"
              style={{ fontFamily: "var(--heading-font)" }}
            >
              Ship in days. Not weekends.
            </h3>
            <p className="text-muted-foreground text-sm">
              A typed full-stack boilerplate — auth, billing, teams. Preview
              text reflects your type, color and radius choices.
            </p>
            <div className="mt-auto flex items-center gap-3">
              <Button size="sm" variant="outline">
                Secondary
              </Button>
              <Button size="sm">Primary →</Button>
            </div>
          </div>

          {/* Controls */}
          <StyleConfigurator className="border border-border bg-card p-8" />
        </div>
      </div>
    </section>
  );
}
