import { MAX_UNIT_MINUTES, MIN_UNIT_MINUTES } from "@/lib/constants";

export type ResolveMinutesInput = {
  explicitUnitMinutes?: number | null;
  fallbackUnitMinutes?: number | null;
};

export const resolveUnitMinutes = ({
  explicitUnitMinutes,
  fallbackUnitMinutes,
}: ResolveMinutesInput) => {
  const minutes = explicitUnitMinutes ?? fallbackUnitMinutes;

  if (minutes === null || minutes === undefined) {
    throw new Error("Unit minutes are required for the first entry.");
  }

  if (!Number.isInteger(minutes)) {
    throw new Error("Unit minutes must be an integer.");
  }

  if (minutes < MIN_UNIT_MINUTES || minutes > MAX_UNIT_MINUTES) {
    throw new Error(
      `Unit minutes must be between ${MIN_UNIT_MINUTES} and ${MAX_UNIT_MINUTES}.`,
    );
  }

  return minutes;
};

export type TotalsInput = Array<{
  units: number;
  totalMinutes: number;
}>;

export const computeTitleTotals = (logs: TotalsInput) => {
  return logs.reduce(
    (acc, log) => ({
      totalUnits: acc.totalUnits + log.units,
      totalMinutes: acc.totalMinutes + log.totalMinutes,
    }),
    { totalUnits: 0, totalMinutes: 0 },
  );
};
