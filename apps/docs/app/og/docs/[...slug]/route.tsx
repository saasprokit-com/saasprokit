import { generate as DefaultImage } from "fumadocs-ui/og";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;
// Every real image is prerendered by generateStaticParams below. Pinning
// dynamicParams keeps satori/resvg-wasm off the runtime path — workerd forbids
// runtime WASM compilation, so an unknown slug must 404 rather than render.
export const dynamicParams = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/docs/[...slug]">
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));

  if (!page) {
    return notFound();
  }

  return new ImageResponse(
    <DefaultImage
      description={page.data.description}
      site="next-nest-monorepo"
      title={page.data.title}
    />,
    {
      width: 1200,
      height: 630,
    }
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
