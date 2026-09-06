import { MILLISECONDS_PER_DAY } from "@repo/utils/date";
import type { DashboardRange } from "@/lib/parsers";

export interface DailyCount {
  count: number;
  day: string;
}

export interface ResolvedRange {
  days: number;
  since: Date;
}

const RANGE_DAYS: Record<DashboardRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DAY_KEY_LENGTH = 10;

export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, DAY_KEY_LENGTH);
}

export function resolveRange(
  range: DashboardRange,
  now = new Date()
): ResolvedRange {
  const days = RANGE_DAYS[range];
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  return {
    days,
    since: new Date(todayStart - (days - 1) * MILLISECONDS_PER_DAY),
  };
}

export function zeroFill(
  rows: DailyCount[],
  since: Date,
  days: number
): DailyCount[] {
  const counts = new Map(rows.map((row) => [row.day, row.count]));

  return Array.from({ length: days }, (_, index) => {
    const day = toDayKey(
      new Date(since.getTime() + index * MILLISECONDS_PER_DAY)
    );

    return { count: counts.get(day) ?? 0, day };
  });
}

const dayLabelFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDayLabel(day: string): string {
  return dayLabelFormat.format(new Date(`${day}T00:00:00.000Z`));
}
