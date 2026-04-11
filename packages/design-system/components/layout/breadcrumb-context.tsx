"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbContextValue = {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const value = useMemo(() => ({ items, setItems }), [items]);

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error(
      "useBreadcrumbContext must be used within a BreadcrumbProvider"
    );
  }
  return context;
}

/**
 * Hook to set breadcrumb items from a client component.
 * Call this in your page component to define the breadcrumb trail.
 *
 * @example
 * useBreadcrumbs([
 *   { label: "Organization", href: "/org/acme" },
 *   { label: "Members" }
 * ])
 */
export function useBreadcrumbs(items: BreadcrumbItem[]) {
  const { setItems } = useBreadcrumbContext();
  const _itemsKey = JSON.stringify(items);

  useEffect(() => {
    setItems(items);
    return () => setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setItems, items]);
}

/**
 * Client component to set breadcrumbs from a server component page.
 * Place this at the top of your page to define the breadcrumb trail.
 *
 * @example
 * <SetBreadcrumbs items={[
 *   { label: "Organization", href: "/org/acme" },
 *   { label: "Members" }
 * ]} />
 */
export function SetBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  useBreadcrumbs(items);
  return null;
}
