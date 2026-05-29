/**
 * Generates all possible time slots for a working day.
 * Working hours: 09:00 – 17:00
 *
 * @param date     - The target date (YYYY-MM-DD)
 * @param duration - Service duration in minutes
 * @returns Array of { start: Date, end: Date } slot pairs
 */
export function generateDaySlots(
  date: string,
  durationMinutes: number
): Array<{ start: Date; end: Date }> {
  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 17;

  const slots: Array<{ start: Date; end: Date }> = [];

  // Build a base date at midnight UTC
  const [year, month, day] = date.split("-").map(Number);

  let cursor = new Date(Date.UTC(year, month - 1, day, WORK_START_HOUR, 0, 0, 0));
  const workEnd = new Date(Date.UTC(year, month - 1, day, WORK_END_HOUR, 0, 0, 0));

  while (true) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd > workEnd) break;

    slots.push({ start: new Date(cursor), end: new Date(slotEnd) });
    cursor = slotEnd;
  }

  return slots;
}

/**
 * Returns true if two time ranges overlap.
 */
export function slotsOverlap(
  slotStart: Date,
  slotEnd: Date,
  bookedStart: Date,
  bookedEnd: Date
): boolean {
  return slotStart < bookedEnd && slotEnd > bookedStart;
}
