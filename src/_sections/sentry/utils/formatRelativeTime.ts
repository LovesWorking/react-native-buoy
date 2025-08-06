/**
 * Formats a timestamp as relative time (e.g., "1s ago", "5m ago", "2h ago")
 * @param timestamp - The timestamp to format
 * @param currentTime - Current time (from tick provider)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number, currentTime: number = Date.now()): string {
  const seconds = Math.floor((currentTime - timestamp) / 1000);
  
  // Handle edge cases
  if (seconds < 0) {
    return "just now";
  }
  
  if (seconds < 60) {
    return seconds === 0 ? "just now" : `${seconds}s ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}