import type { ConsoleTransportEntry } from './types';

let entries: ConsoleTransportEntry[] = [];

export function add(entry: ConsoleTransportEntry) {
  entries.unshift(entry);
  entries = entries.slice(0, 500);
}

export function getEntries() {
  return entries;
}

export function clearEntries() {
  entries = [];
}
