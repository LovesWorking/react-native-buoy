/**
 * Format a number with thousand separators
 * @param num - The number to format
 * @returns Formatted string with commas
 * @example formatNumber(1000000) => "1,000,000"
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format a number as currency
 * @param num - The number to format
 * @param currency - Currency symbol (default: $)
 * @returns Formatted currency string
 * @example formatCurrency(1234.56) => "$1,234.56"
 */
export function formatCurrency(num: number, currency = '$'): string {
  return `${currency}${formatNumber(Number(num.toFixed(2)))}`;
}

/**
 * Capitalize the first letter of a string
 * @param str - The string to capitalize
 * @returns Capitalized string
 * @example capitalize('hello') => "Hello"
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}