import { isAdult } from "./shared.js";
export { isAdult };

// ── Date helpers (all dates are "YYYY-MM-DD" local strings) ───────────────────

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

// Returns the Monday of the week containing `iso`.
export function isoWeekStart(iso) {
  const d = fromISODate(iso);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

// Inclusive list of ISO date strings from start to end.
export function daysInRange(startIso, endIso) {
  const days = [];
  let cur = startIso;
  while (cur <= endIso) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weekdayLabel(iso) {
  return WEEKDAY_LABELS[fromISODate(iso).getDay()];
}

export function monthDayLabel(iso) {
  const d = fromISODate(iso);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
}

export function relativeDay(iso, todayIso) {
  if (iso === todayIso) return "Today";
  if (iso === addDays(todayIso, 1)) return "Tomorrow";
  return `${weekdayLabel(iso)} ${monthDayLabel(iso)}`;
}

// ── Rotation generation ─────────────────────────────────────────────────────

/**
 * Generate { date, member_id } pairs covering [startIso, endIso].
 * style "round-robin": cycles through memberIds in order across the range.
 * style "weekday": same member assigned to the same day-of-week every week
 *   (member at index `dayOfWeek % memberIds.length`).
 */
export function generateRotation(startIso, endIso, memberIds, style = "round-robin") {
  const days = daysInRange(startIso, endIso);
  if (memberIds.length === 0) return days.map(date => ({ date, member_id: null }));

  if (style === "weekday") {
    return days.map(date => {
      const dow = fromISODate(date).getDay();
      return { date, member_id: memberIds[dow % memberIds.length] };
    });
  }

  return days.map((date, i) => ({ date, member_id: memberIds[i % memberIds.length] }));
}

// ── Grouping helpers ──────────────────────────────────────────────────────────

export function groupByDate(shifts) {
  const map = new Map();
  for (const s of shifts) {
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date).push(s);
  }
  return map;
}

export function groupByType(shifts) {
  const map = new Map();
  for (const s of shifts) {
    if (!map.has(s.shift_type_id)) map.set(s.shift_type_id, []);
    map.get(s.shift_type_id).push(s);
  }
  return map;
}

// ── Claim helpers ─────────────────────────────────────────────────────────────

// Claims are rows from shift_claims: { id, shift_id, member_id }.

export function claimsFor(claims, shiftId) {
  return claims.filter(c => c.shift_id === shiftId);
}

export function openSpots(shift, claims) {
  return Math.max(0, (shift.capacity ?? 1) - claimsFor(claims, shift.id).length);
}

export function hasClaim(claims, shiftId, memberId) {
  return claims.some(c => c.shift_id === shiftId && c.member_id === memberId);
}

// ── Access control ────────────────────────────────────────────────────────────

// Leadership = adults/admins. Anyone can claim an open shift; only leadership
// can create shifts, assign other members, and generate rotations.
export function canManage(me) {
  return isAdult(me);
}
