import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { DEMO_URL, DOCS_PATH, SITE_URL } from "@/lib/site";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            alt=""
            height={24}
            priority
            src={`${DOCS_PATH}/icon.svg`}
            unoptimized
            width={24}
          />
          <span>saasprokit</span>
        </>
      ),
    },
    links: [
      { text: "Live demo", url: DEMO_URL, external: true },
      { text: "saasprokit.com", url: SITE_URL, external: true },
    ],
  };
}
