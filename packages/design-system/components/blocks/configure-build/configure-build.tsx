"use client";

import { SectionHeading } from "@repo/design-system/components/blocks/section-heading/section-heading";
import { StyleConfigurator } from "@repo/design-system/components/blocks/style-configurator/style-configurator";

export function ConfigureBuild() {
  return (
    <section
      className="border-border border-b bg-muted/50 px-6 py-20 sm:px-10"
      id="customize"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading subtitle="preview updates live · applies to this page">
          Configure your styles based on your flavor
        </SectionHeading>

        <StyleConfigurator className="border border-border bg-card p-8" />
      </div>
    </section>
  );
}
