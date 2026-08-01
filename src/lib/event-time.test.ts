import assert from "node:assert/strict";
import test from "node:test";
import {
  addCivilDays,
  eventDateTimeValue,
  formatEventDateRange,
  formatEventTime,
  inferEventCategory,
  inferEventTime,
  isCivilDate,
  parseCivilDate,
  todayInTimeZone,
  zonedDateTimeToUtc,
} from "./event-time";

test("civil dates validate and round-trip without a host timezone", () => {
  assert.equal(isCivilDate("2024-02-29"), true);
  assert.equal(isCivilDate("2026-02-29"), false);
  assert.equal(isCivilDate("2026-13-01"), false);
  assert.equal(parseCivilDate("2026-08-21").toISOString(), "2026-08-21T00:00:00.000Z");
  assert.equal(addCivilDays("2026-12-31", 1), "2027-01-01");
});

test("today is calculated in the club timezone", () => {
  assert.equal(
    todayInTimeZone("Europe/Berlin", new Date("2026-08-01T22:30:00.000Z")),
    "2026-08-02",
  );
});

test("Berlin wall times convert consistently in winter and summer", () => {
  assert.equal(
    zonedDateTimeToUtc("2026-01-10", "13:00").toISOString(),
    "2026-01-10T12:00:00.000Z",
  );
  assert.equal(
    zonedDateTimeToUtc("2026-08-21", "20:00").toISOString(),
    "2026-08-21T18:00:00.000Z",
  );
  assert.throws(() => zonedDateTimeToUtc("2026-03-29", "02:30"));
});

test("structured dates distinguish all-day and timed events", () => {
  assert.equal(
    eventDateTimeValue({ date: "2026-08-22", allDay: true }),
    "2026-08-22",
  );
  assert.equal(
    eventDateTimeValue({ date: "2026-08-21", time: "20:00", allDay: false }),
    "2026-08-21T18:00:00.000Z",
  );
});

test("event labels and legacy inference preserve useful semantics", () => {
  assert.match(formatEventDateRange("2026-08-21", "2026-08-22"), /21\.08\.2026.*22\.08\.2026/);
  assert.equal(formatEventTime(false, "13:00", "15:00"), "13:00–15:00 Uhr");
  assert.equal(formatEventTime(true, null, null), "Ganztägig");
  assert.deepEqual(inferEventTime("19.00 Uhr Bezirksrosenkranz"), {
    startTime: "19:00",
    endTime: null,
  });
  assert.deepEqual(inferEventTime("13:00 – 15:00 Uhr Kartenvorverkauf"), {
    startTime: "13:00",
    endTime: "15:00",
  });
  assert.equal(inferEventCategory("Poolparty", "Kolpingwiese (Jugend)"), "jugend");
  assert.equal(inferEventCategory("Konzert", "Blaskapelle"), "kapelle");
});
