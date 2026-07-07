/**
 * Native scheduling core. All times operate in America/Phoenix (UTC-7, no
 * DST), the platform's home timezone. Slots are 30 minutes.
 */

export const PHOENIX_UTC_OFFSET = 7; // hours behind UTC, constant (no DST)
export const SLOT_MINUTES = 30;

export interface AvailabilityWindow {
  weekday: number; // 0 = Sunday
  start_minute: number;
  end_minute: number;
}

export const DEFAULT_AVAILABILITY: AvailabilityWindow[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  start_minute: 9 * 60, // 9:00 AM
  end_minute: 17 * 60, // 5:00 PM
}));

/** Current date parts in Phoenix time. */
function phoenixNow(): Date {
  return new Date(Date.now() - PHOENIX_UTC_OFFSET * 3600 * 1000);
}

/** Build ISO (UTC) timestamp for a Phoenix-local day + minute-of-day. */
function phoenixToUtcIso(yearUTC: number, monthUTC: number, dayUTC: number, minuteOfDay: number): string {
  return new Date(Date.UTC(yearUTC, monthUTC, dayUTC, PHOENIX_UTC_OFFSET, minuteOfDay)).toISOString();
}

export interface Slot {
  iso: string; // UTC instant
  label: string; // "9:30 AM"
  dayKey: string; // "2026-07-08"
  dayLabel: string; // "Wed, Jul 8"
}

/** Enumerate open slots for the next `days` days given windows and taken starts. */
export function computeSlots(windows: AvailabilityWindow[], takenIso: Set<string>, days = 14): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  const base = phoenixNow();

  for (let d = 1; d <= days; d++) {
    const day = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + d));
    const weekday = day.getUTCDay();
    for (const w of windows.filter((w) => w.weekday === weekday)) {
      for (let m = w.start_minute; m + SLOT_MINUTES <= w.end_minute; m += SLOT_MINUTES) {
        const iso = phoenixToUtcIso(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), m);
        if (takenIso.has(iso) || new Date(iso) <= now) continue;
        const h = Math.floor(m / 60);
        const min = m % 60;
        const h12 = ((h + 11) % 12) + 1;
        slots.push({
          iso,
          label: `${h12}:${min.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
          dayKey: day.toISOString().slice(0, 10),
          dayLabel: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
        });
      }
    }
  }
  return slots;
}
