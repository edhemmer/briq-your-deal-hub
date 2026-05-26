/**
 * ContractIQ — Calendar (Module E)
 *
 * Deterministic .ics builder and week-bucket helper for contract deadlines.
 *
 * - .ics output follows RFC 5545: VCALENDAR/VEVENT, CRLF line endings,
 *   line-folding at 75 octets, escaped TEXT fields. All-day events use
 *   VALUE=DATE per spec.
 * - Week buckets group deadlines from today forward into ISO weeks for
 *   the week-view UI. Past and missing deadlines are surfaced in their
 *   own buckets so nothing is silently dropped.
 */

import type { Deadline } from "./contractIQEngine";

// ── .ics builders ────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

/** Format Date -> YYYYMMDD (UTC). All-day VEVENTs use DATE value. */
const toIcsDate = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

/** Format Date -> YYYYMMDDTHHMMSSZ (UTC). Used for DTSTAMP. */
const toIcsDateTime = (d: Date): string =>
  `${toIcsDate(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/** Escape RFC 5545 TEXT field: backslash, comma, semicolon, newline. */
const escText = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

/** Fold long lines at 75 octets with CRLF + space continuation. */
const foldLine = (line: string): string => {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + (i === 0 ? 75 : 74));
    out.push((i === 0 ? "" : " ") + chunk);
    i += i === 0 ? 75 : 74;
  }
  return out.join("\r\n");
};

export interface IcsEventInput {
  uid: string;
  summary: string;
  description?: string;
  /** All-day date (YYYY-MM-DD). */
  date: string;
}

/** Build an .ics calendar string from contract deadlines that have real dates. */
export function buildIcs(
  calendarName: string,
  events: IcsEventInput[],
  now: Date = new Date(),
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BRIX//ContractIQ//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escText(calendarName)}`,
  ];
  const stamp = toIcsDateTime(now);
  for (const ev of events) {
    const start = new Date(`${ev.date}T00:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1); // all-day: DTEND is exclusive
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}@brix.contractiq`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(start)}`,
      `DTEND;VALUE=DATE:${toIcsDate(end)}`,
      `SUMMARY:${escText(ev.summary)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escText(ev.description)}`);
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Trigger a client-side download of an .ics file. */
export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Convert a Deadline into an .ics event when it has a real date. */
export function deadlineToIcsEvent(
  d: Deadline,
  contractTitle: string,
): IcsEventInput | null {
  if (!d.date) return null;
  return {
    uid: `${d.id}-${d.date}`,
    summary: `${contractTitle} — ${d.label}`,
    description:
      d.daysFromEffective != null
        ? `Computed from effective date (+${d.daysFromEffective} days).`
        : "Contract deadline.",
    date: d.date,
  };
}

// ── Week buckets for the week-view UI ────────────────────────────────

export interface WeekBucket {
  /** "past" | "this-week" | ISO date of the Monday | "later" | "unscheduled" */
  key: string;
  label: string;
  /** Date of the Monday of the week (null for past/later/unscheduled). */
  weekStart: Date | null;
  deadlines: Deadline[];
}

const startOfWeek = (d: Date): Date => {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  out.setDate(out.getDate() - diff);
  return out;
};

const fmtWeekLabel = (start: Date): string => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return sameMonth
    ? `${start.toLocaleDateString("en-US", opts)}–${end.getDate()}`
    : `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
};

/**
 * Bucket deadlines into 4 upcoming weeks plus "Past", "Later", and "Unscheduled".
 * Deterministic given the same `now`.
 */
export function bucketDeadlinesByWeek(
  deadlines: Deadline[],
  now: Date = new Date(),
  weeksAhead = 4,
): WeekBucket[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const thisMonday = startOfWeek(today);

  const buckets: WeekBucket[] = [];
  buckets.push({ key: "past", label: "Past due", weekStart: null, deadlines: [] });
  for (let i = 0; i < weeksAhead; i++) {
    const ws = new Date(thisMonday);
    ws.setDate(ws.getDate() + i * 7);
    buckets.push({
      key: ws.toISOString().slice(0, 10),
      label: i === 0 ? `This week (${fmtWeekLabel(ws)})` : `Week of ${fmtWeekLabel(ws)}`,
      weekStart: ws,
      deadlines: [],
    });
  }
  buckets.push({ key: "later", label: `Later (4+ weeks out)`, weekStart: null, deadlines: [] });
  buckets.push({ key: "unscheduled", label: "Unscheduled (no date)", weekStart: null, deadlines: [] });

  const horizonEnd = new Date(thisMonday);
  horizonEnd.setDate(horizonEnd.getDate() + weeksAhead * 7);

  for (const d of deadlines) {
    if (!d.date) {
      buckets[buckets.length - 1].deadlines.push(d);
      continue;
    }
    const dt = new Date(`${d.date}T00:00:00`);
    if (dt < today) {
      buckets[0].deadlines.push(d);
      continue;
    }
    if (dt >= horizonEnd) {
      buckets[buckets.length - 2].deadlines.push(d);
      continue;
    }
    const wkIdx = Math.floor((dt.getTime() - thisMonday.getTime()) / (7 * 86_400_000));
    buckets[1 + wkIdx].deadlines.push(d);
  }

  // Sort each bucket by date for stable display.
  for (const b of buckets) {
    b.deadlines.sort((a, c) => (a.date ?? "").localeCompare(c.date ?? ""));
  }

  return buckets;
}
