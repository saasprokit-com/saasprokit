import { renderMermaidSVG } from "beautiful-mermaid";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";

interface MermaidProps {
  chart: string;
}

// Server Component: beautiful-mermaid renders to SVG with no DOM dependency,
// so diagrams are baked into the static HTML at build time (no client bundle).
// Fenced ```mermaid blocks are rewritten to <Mermaid /> by remarkMdxMermaid.
export async function Mermaid({ chart }: MermaidProps) {
  try {
    const svg = await renderMermaidSVG(chart, {
      bg: "var(--color-fd-background)",
      fg: "var(--color-fd-foreground)",
      interactive: true,
      transparent: true,
    });

    // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is generated server-side from trusted MDX content
    return <div dangerouslySetInnerHTML={{ __html: svg }} />;
  } catch {
    // Fall back to the raw diagram source so a parse failure never breaks the build.
    return (
      <CodeBlock title="Mermaid">
        <Pre>{chart}</Pre>
      </CodeBlock>
    );
  }
}
