import { describe, it, expect } from "vitest";
import { generateDaySlots, slotsOverlap } from "../utils/time";

// ---------------------------------------------------------------------------
// generateDaySlots
// ---------------------------------------------------------------------------

describe("generateDaySlots", () => {
  it("generates the correct number of 30-minute slots for a full day", () => {
    // 09:00 → 17:00 = 8 hours = 16 × 30-minute slots
    const slots = generateDaySlots("2024-06-15", 30);
    expect(slots).toHaveLength(16);
  });

  it("first slot starts at 09:00 UTC", () => {
    const slots = generateDaySlots("2024-06-15", 30);
    expect(slots[0].start.getUTCHours()).toBe(9);
    expect(slots[0].start.getUTCMinutes()).toBe(0);
  });

  it("last slot ends exactly at 17:00 UTC", () => {
    const slots = generateDaySlots("2024-06-15", 30);
    const last = slots[slots.length - 1];
    expect(last.end.getUTCHours()).toBe(17);
    expect(last.end.getUTCMinutes()).toBe(0);
  });

  it("generates the correct number of 60-minute slots", () => {
    // 09:00 → 17:00 = 8 hours = 8 × 60-minute slots
    const slots = generateDaySlots("2024-06-15", 60);
    expect(slots).toHaveLength(8);
  });

  it("generates the correct number of 90-minute slots", () => {
    // 09:00 → 17:00 = 480 min / 90 = 5 slots (last would start 15:00, end 16:30)
    const slots = generateDaySlots("2024-06-15", 90);
    expect(slots).toHaveLength(5);
  });

  it("returns no slots when duration exceeds working day length", () => {
    // 09:00 + 600 min = 19:00, which is past 17:00 → no slots
    const slots = generateDaySlots("2024-06-15", 600);
    expect(slots).toHaveLength(0);
  });

  it("each slot's end equals the next slot's start", () => {
    const slots = generateDaySlots("2024-06-15", 30);
    for (let i = 0; i < slots.length - 1; i++) {
      expect(slots[i].end.getTime()).toBe(slots[i + 1].start.getTime());
    }
  });

  it("slot duration matches the requested durationMinutes", () => {
    const slots = generateDaySlots("2024-06-15", 45);
    for (const slot of slots) {
      const diffMinutes = (slot.end.getTime() - slot.start.getTime()) / 60_000;
      expect(diffMinutes).toBe(45);
    }
  });
});

// ---------------------------------------------------------------------------
// slotsOverlap
// ---------------------------------------------------------------------------

describe("slotsOverlap", () => {
  // Helper: build a UTC Date for a given hour:minute on a fixed date
  const d = (h: number, m = 0) =>
    new Date(Date.UTC(2024, 5, 15, h, m, 0));

  it("returns true when slot is completely inside a booked range", () => {
    // slot:   10:00 – 10:30
    // booked: 09:00 – 11:00
    expect(slotsOverlap(d(10), d(10, 30), d(9), d(11))).toBe(true);
  });

  it("returns true when slot completely contains a booked range", () => {
    // slot:   09:00 – 11:00
    // booked: 10:00 – 10:30
    expect(slotsOverlap(d(9), d(11), d(10), d(10, 30))).toBe(true);
  });

  it("returns true when slot overlaps the start of a booked range", () => {
    // slot:   09:30 – 10:30
    // booked: 10:00 – 11:00
    expect(slotsOverlap(d(9, 30), d(10, 30), d(10), d(11))).toBe(true);
  });

  it("returns true when slot overlaps the end of a booked range", () => {
    // slot:   10:30 – 11:30
    // booked: 10:00 – 11:00
    expect(slotsOverlap(d(10, 30), d(11, 30), d(10), d(11))).toBe(true);
  });

  it("returns false when slot is entirely before a booked range", () => {
    // slot:   09:00 – 09:30
    // booked: 10:00 – 11:00
    expect(slotsOverlap(d(9), d(9, 30), d(10), d(11))).toBe(false);
  });

  it("returns false when slot is entirely after a booked range", () => {
    // slot:   11:30 – 12:00
    // booked: 10:00 – 11:00
    expect(slotsOverlap(d(11, 30), d(12), d(10), d(11))).toBe(false);
  });

  it("returns false when slot ends exactly when booked range starts (adjacent, not overlapping)", () => {
    // slot:   09:00 – 10:00
    // booked: 10:00 – 11:00
    expect(slotsOverlap(d(9), d(10), d(10), d(11))).toBe(false);
  });

  it("returns false when slot starts exactly when booked range ends (adjacent, not overlapping)", () => {
    // slot:   11:00 – 12:00
    // booked: 10:00 – 11:00
    expect(slotsOverlap(d(11), d(12), d(10), d(11))).toBe(false);
  });
});
