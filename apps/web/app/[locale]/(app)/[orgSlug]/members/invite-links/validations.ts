import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { sortingStateParser } from "@/lib/parsers";

export const inviteLinksSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: sortingStateParser.withDefault([]),
  search: parseAsString.withDefault(""),
  role: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsString).withDefault([]),
});

export type InviteLinksSearchParams = Awaited<
  ReturnType<typeof inviteLinksSearchParamsCache.parse>
>;
