import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { sortingStateParser } from "@/lib/parsers";

export const membersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  sorts: sortingStateParser.withDefault([]),
  q: parseAsString.withDefault(""),
  roles: parseAsArrayOf(parseAsString).withDefault([]),
});

export type MembersSearchParams = Awaited<
  ReturnType<typeof membersSearchParamsCache.parse>
>;
