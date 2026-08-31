import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins";
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";

// Frontmatter/meta stay on Fumadocs defaults; mermaid is the only extra plugin.
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // Rewrites fenced ```mermaid blocks into <Mermaid /> components at build time.
    remarkPlugins: [remarkMdxMermaid],
  },
});
