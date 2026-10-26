/**
 * EVShield Canonical Date & Time Utility
 *
 * Implements centralized timestamp parsing and formatting:
 * - Server canonical timestamps are stored & transmitted in ISO 8601 UTC.
 * - Converted to the user's local browser timezone only when rendering.
 * - Handles relative times ("5s ago", "2m ago") computed from actual timestamps.
 * - Handles durations and invalid/missing timestamp fallbacks safely.
 */

/**
 * Parse an ISO UTC string, epoch millisecond number, or Date into a valid Date object.
 * Returns null if invalid or missing.
 */
export function parseTimestamp(val: string | number | Date | null | undefined): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    // If epoch seconds (10 digits), convert to ms
    const ms = val < 1e11 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    // If string is already plain "HH:mm:ss"
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(val.trim())) {
      const today = new Date();
      const parts = val.trim().split(':');
      today.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2] || '0', 10), 0);
      return today;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format timestamp as user local time string "HH:mm:ss" (24-hour).
 */
export function formatTime(val: string | number | Date | null | undefined, fallback = '--:--:--'): string {
  const d = parseTimestamp(val);
  if (!d) return fallback;
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format timestamp as user local date string "YYYY-MM-DD".
 */
export function formatDate(val: string | number | Date | null | undefined, fallback = '----/--/--'): string {
  const d = parseTimestamp(val);
  if (!d) return fallback;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format timestamp as user local full datetime "YYYY-MM-DD HH:mm:ss".
 */
export function formatDateTime(val: string | number | Date | null | undefined, fallback = '----/--/-- --:--:--'): string {
  const d = parseTimestamp(val);
  if (!d) return fallback;
  return `${formatDate(d)} ${formatTime(d)}`;
}

/**
 * Format relative elapsed time from timestamp e.g. "5s ago", "2m ago", "1h ago", "just now".
 */
export function formatRelativeTime(val: string | number | Date | null | undefined, fallback = 'just now'): string {
  const d = parseTimestamp(val);
  if (!d) return fallback;
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 2) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

/**
 * Compute readable duration string between two timestamps e.g. "3m 42s", "18s", or "Ongoing".
 */
export function formatDuration(
  startVal: string | number | Date | null | undefined,
  endVal?: string | number | Date | null | undefined
): string {
  const start = parseTimestamp(startVal);
  if (!start) return 'N/A';
  const end = endVal ? parseTimestamp(endVal) : null;

  if (!end) return 'Ongoing';

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalSecs = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
