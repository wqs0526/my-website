function parseTripDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTripDate(value) {
  const date = parseTripDate(value);
  if (!date) return "Date not set";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTripDateRange(startDate, endDate) {
  const start = formatTripDate(startDate);
  const end = formatTripDate(endDate);

  if (startDate && endDate) return `${start} - ${end}`;
  if (startDate) return `Starts ${start}`;
  if (endDate) return `Until ${end}`;
  return "Dates not set";
}

export function getTripStatus(trip) {
  const start = parseTripDate(trip?.start_date);
  const end = parseTripDate(trip?.end_date) || start;
  const todayValue = new Date();
  const today = new Date(todayValue.getFullYear(), todayValue.getMonth(), todayValue.getDate());

  if (!start) {
    return {
      label: "Planning",
      countdown: "Choose dates",
      tone: "planning",
      daysRemaining: null,
    };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((start.getTime() - today.getTime()) / dayMs);

  if (daysRemaining > 0) {
    return {
      label: "Upcoming Trip",
      countdown: daysRemaining === 1 ? "1 day to go" : `${daysRemaining} days to go`,
      tone: "upcoming",
      daysRemaining,
    };
  }

  if (today.getTime() <= end.getTime()) {
    return {
      label: "Trip in Progress",
      countdown: "Happening now",
      tone: "active",
      daysRemaining: 0,
    };
  }

  return {
    label: "Completed Trip",
    countdown: "Completed Trip",
    tone: "completed",
    daysRemaining,
  };
}
