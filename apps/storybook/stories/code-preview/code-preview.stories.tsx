import { CodePreview } from "@repo/design-system/components/blocks/code-preview/code-preview";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "blocks/code-preview/CodePreview",
  component: CodePreview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CodePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * In production the `html` prop is Shiki-highlighted output generated at build
 * time by a Server Component. Stories mock it with hand-written `<pre>` markup.
 */
const authHtml = `<pre style="margin:0;padding:16px;font-family:ui-monospace,monospace;font-size:13px;line-height:1.6;overflow-x:auto"><code><span style="color:#c678dd">import</span> { auth } <span style="color:#c678dd">from</span> <span style="color:#98c379">"@acme/auth"</span>;

<span style="color:#c678dd">export async function</span> <span style="color:#61afef">getSession</span>() {
  <span style="color:#c678dd">return</span> auth.<span style="color:#61afef">getServerSession</span>();
}</code></pre>`;

const billingHtml = `<pre style="margin:0;padding:16px;font-family:ui-monospace,monospace;font-size:13px;line-height:1.6;overflow-x:auto"><code><span style="color:#c678dd">import</span> { stripe } <span style="color:#c678dd">from</span> <span style="color:#98c379">"@acme/payment"</span>;

<span style="color:#c678dd">const</span> session = <span style="color:#c678dd">await</span> stripe.checkout.sessions.<span style="color:#61afef">create</span>({
  mode: <span style="color:#98c379">"subscription"</span>,
  line_items: [{ price: priceId, quantity: <span style="color:#d19a66">1</span> }],
});</code></pre>`;

const schemaHtml = `<pre style="margin:0;padding:16px;font-family:ui-monospace,monospace;font-size:13px;line-height:1.6;overflow-x:auto"><code><span style="color:#c678dd">model</span> <span style="color:#61afef">Organization</span> {
  id        <span style="color:#e5c07b">String</span>   <span style="color:#56b6c2">@id</span> <span style="color:#56b6c2">@default</span>(cuid())
  name      <span style="color:#e5c07b">String</span>
  members   <span style="color:#e5c07b">Member</span>[]
  createdAt <span style="color:#e5c07b">DateTime</span> <span style="color:#56b6c2">@default</span>(now())
}</code></pre>`;

/**
 * Multiple file tabs, defaulting to the first tab.
 */
export const Default: Story = {
  args: {
    tabs: [
      { id: "auth", label: "auth.ts", html: authHtml },
      { id: "billing", label: "billing.ts", html: billingHtml },
      { id: "schema", label: "schema.prisma", html: schemaHtml },
    ],
  },
};

/**
 * A single tab for showcasing one snippet.
 */
export const SingleTab: Story = {
  args: {
    tabs: [{ id: "auth", label: "auth.ts", html: authHtml }],
  },
};

/**
 * `defaultTab` opens a tab other than the first one.
 */
export const WithDefaultTab: Story = {
  args: {
    defaultTab: "schema",
    tabs: [
      { id: "auth", label: "auth.ts", html: authHtml },
      { id: "billing", label: "billing.ts", html: billingHtml },
      { id: "schema", label: "schema.prisma", html: schemaHtml },
    ],
  },
};

/**
 * Custom width constraint via `className`.
 */
export const Constrained: Story = {
  args: {
    className: "mx-auto my-12 max-w-3xl",
    tabs: [
      { id: "auth", label: "auth.ts", html: authHtml },
      { id: "billing", label: "billing.ts", html: billingHtml },
    ],
  },
};
