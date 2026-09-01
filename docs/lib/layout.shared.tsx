import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            alt=""
            height={24}
            priority
            src="/icon.svg"
            unoptimized
            width={24}
          />
          <span>saasprokit</span>
        </>
      ),
    },
    links: [{ text: "Docs", url: "/docs" }],
  };
}
