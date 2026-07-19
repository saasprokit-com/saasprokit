import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { sortingStateParser } from "@/lib/parsers";

export const usersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: sortingStateParser.withDefault([]),
  q: parseAsString.withDefault(""),
  roles: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsStringLiteral([
    "all",
    "active",
    "banned",
  ] as const).withDefault("all"),
});

export type UsersSearchParams = Awaited<
  ReturnType<typeof usersSearchParamsCache.parse>
>;
