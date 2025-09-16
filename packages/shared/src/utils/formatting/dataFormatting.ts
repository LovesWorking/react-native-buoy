/**
 * Shared data formatting utilities
 */

/**
 * Format byte size to human-readable format
 * @param bytes Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return "N/A";
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format duration from milliseconds to human-readable format
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "500ms", "1.5s", "2m 30s")
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return "N/A";

  if (ms < 1000) {
    return `${ms}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Format a number with thousand separators
 * @param num The number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Truncate a string in the middle with ellipsis
 * @param str The string to truncate
 * @param maxLength Maximum length before truncation
 * @param startChars Number of characters to show at start
 * @param endChars Number of characters to show at end
 * @returns Truncated string
 */
export function truncateMiddle(
  str: string,
  maxLength: number = 50,
  startChars: number = 20,
  endChars: number = 20,
): string {
  if (str.length <= maxLength) return str;

  const start = str.slice(0, startChars);
  const end = str.slice(-endChars);

  return `${start}...${end}`;
}
