import Link from "next/link";

interface FooterColumn {
  links: { label: string; href: string }[];
  title: string;
}

interface FooterTerminalProps {
  brand: string;
  columns: FooterColumn[];
  copyright: string;
  taglines?: string[];
}

export function Footer({
  brand,
  taglines = [],
  columns,
  copyright,
}: FooterTerminalProps) {
  return (
    <footer className="border-border border-t px-6 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 border-border border-b py-16 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <span className="font-bold font-mono text-lg">{brand}</span>
            {taglines.length > 0 && (
              <div className="mt-2 font-mono text-muted-foreground text-xs">
                {taglines.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <span className="font-mono text-muted-foreground text-xs">
                {col.title}
              </span>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="font-mono text-foreground text-sm transition-colors hover:text-muted-foreground"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between py-6 font-mono text-muted-foreground text-xs">
          <span>{copyright}</span>
        </div>
      </div>
    </footer>
  );
}
