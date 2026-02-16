export const formatMinutes = (minutes: number) => {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;

  if (hours === 0) {
    return `${remaining}m`;
  }

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
};

export const formatHoursDecimal = (minutes: number) => {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  return (safeMinutes / 60).toFixed(1);
};

export const formatRatio = (ratio: number) => {
  if (!Number.isFinite(ratio)) {
    return "0.00";
  }

  return ratio.toFixed(2);
};

export const formatLoggedAt = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
