import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { sortingStateParser } from "@/lib/parsers";

export const orgsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: sortingStateParser.withDefault([]),
  q: parseAsString.withDefault(""),
  plans: parseAsArrayOf(parseAsString).withDefault([]),
});

export type OrgsSearchParams = Awaited<
  ReturnType<typeof orgsSearchParamsCache.parse>
>;
