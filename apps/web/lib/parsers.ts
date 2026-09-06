import type { SortingState } from "@tanstack/react-table";
import {
  createParser,
  createSearchParamsCache,
  parseAsStringLiteral,
} from "nuqs/server";

/**
 * Custom nuqs parser for TanStack Table SortingState.
 * Serializes to human-readable URL format: "user.asc,createdAt.desc"
 */
export const sortingStateParser = createParser<SortingState>({
  parse: (value) => {
    if (!value) {
      return [];
    }
    return value.split(",").map((segment) => {
      const separatorIndex = segment.lastIndexOf(".");
      const id = segment.slice(0, separatorIndex);
      const direction = segment.slice(separatorIndex + 1);
      return { id, desc: direction === "desc" };
    });
  },
  serialize: (value) =>
    value.map((sort) => `${sort.id}.${sort.desc ? "desc" : "asc"}`).join(","),
  eq: (a, b) => {
    if (a.length !== b.length) {
      return false;
    }
    return a.every(
      (sort, index) => sort.id === b[index].id && sort.desc === b[index].desc
    );
  },
});

export const DASHBOARD_RANGES = ["7d", "30d", "90d"] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const dashboardRangeParser =
  parseAsStringLiteral(DASHBOARD_RANGES).withDefault("30d");

export const dashboardSearchParamsCache = createSearchParamsCache({
  range: dashboardRangeParser,
});
