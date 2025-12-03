/**
 * BenchmarkStorage
 *
 * Handles persistence of benchmark reports to AsyncStorage.
 * Provides methods to save, load, list, and delete benchmark reports.
 *
 * Storage keys:
 *   - @benchmark/index: Array of report metadata (id, name, createdAt)
 *   - @benchmark/report/{id}: Full report data
 *
 * @packageDocumentation
 */

"use strict";

import type { BenchmarkReport } from "./types";

/**
 * Storage adapter interface - allows for different storage backends
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Metadata for a stored benchmark (stored in index)
 */
export interface BenchmarkMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  duration: number;
  batchCount: number;
}

// Storage key prefix
const STORAGE_PREFIX = "@react-buoy/benchmark";
const INDEX_KEY = `${STORAGE_PREFIX}/index`;
const REPORT_KEY_PREFIX = `${STORAGE_PREFIX}/report/`;

/**
 * Get the storage key for a report
 */
function getReportKey(id: string): string {
  return `${REPORT_KEY_PREFIX}${id}`;
}

/**
 * Extract metadata from a full report
 */
function extractMetadata(report: BenchmarkReport): BenchmarkMetadata {
  return {
    id: report.id,
    name: report.name,
    description: report.description,
    createdAt: report.createdAt,
    duration: report.duration,
    batchCount: report.stats.batchCount,
  };
}

/**
 * BenchmarkStorage - Manages persistence of benchmark reports
 */
export class BenchmarkStorage {
  private storage: StorageAdapter;

  /**
   * Create a new BenchmarkStorage instance
   * @param storage - Storage adapter (e.g., AsyncStorage)
   */
  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Save a benchmark report
   * @returns The saved report's metadata
   */
  async saveReport(report: BenchmarkReport): Promise<BenchmarkMetadata> {
    // Load current index
    const index = await this.loadIndex();

    // Check if report already exists
    const existingIndex = index.findIndex((m) => m.id === report.id);
    if (existingIndex >= 0) {
      // Update existing entry
      index[existingIndex] = extractMetadata(report);
    } else {
      // Add new entry
      index.push(extractMetadata(report));
    }

    // Save report and update index
    await Promise.all([
      this.storage.setItem(getReportKey(report.id), JSON.stringify(report)),
      this.storage.setItem(INDEX_KEY, JSON.stringify(index)),
    ]);

    console.log(`[BenchmarkStorage] Saved report: ${report.name} (${report.id})`);

    return extractMetadata(report);
  }

  /**
   * Load a benchmark report by ID
   * @returns The report, or null if not found
   */
  async loadReport(id: string): Promise<BenchmarkReport | null> {
    try {
      const data = await this.storage.getItem(getReportKey(id));
      if (!data) return null;

      const report = JSON.parse(data) as BenchmarkReport;
      return report;
    } catch (error) {
      console.error(`[BenchmarkStorage] Error loading report ${id}:`, error);
      return null;
    }
  }

  /**
   * Load all benchmark metadata (for listing)
   */
  async listReports(): Promise<BenchmarkMetadata[]> {
    const index = await this.loadIndex();
    // Sort by createdAt descending (newest first)
    return index.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Delete a benchmark report
   * @returns true if deleted, false if not found
   */
  async deleteReport(id: string): Promise<boolean> {
    // Load current index
    const index = await this.loadIndex();

    // Find and remove from index
    const existingIndex = index.findIndex((m) => m.id === id);
    if (existingIndex < 0) {
      return false;
    }

    index.splice(existingIndex, 1);

    // Remove report and update index
    await Promise.all([
      this.storage.removeItem(getReportKey(id)),
      this.storage.setItem(INDEX_KEY, JSON.stringify(index)),
    ]);

    console.log(`[BenchmarkStorage] Deleted report: ${id}`);

    return true;
  }

  /**
   * Delete all benchmark reports
   */
  async clearAll(): Promise<void> {
    const index = await this.loadIndex();

    // Delete all reports
    await Promise.all([
      ...index.map((m) => this.storage.removeItem(getReportKey(m.id))),
      this.storage.removeItem(INDEX_KEY),
    ]);

    console.log(`[BenchmarkStorage] Cleared ${index.length} reports`);
  }

  /**
   * Update a benchmark report's name and/or description
   * @returns true if updated, false if not found
   */
  async updateReport(
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<boolean> {
    // Load the report
    const report = await this.loadReport(id);
    if (!report) return false;

    // Apply updates
    if (updates.name !== undefined) {
      report.name = updates.name;
    }
    if (updates.description !== undefined) {
      report.description = updates.description;
    }

    // Save updated report (this also updates the index)
    await this.saveReport(report);

    console.log(`[BenchmarkStorage] Updated report: ${id}`);

    return true;
  }

  /**
   * Get the most recent report
   */
  async getMostRecent(): Promise<BenchmarkReport | null> {
    const reports = await this.listReports();
    if (reports.length === 0) return null;
    return this.loadReport(reports[0].id);
  }

  /**
   * Get reports by name (for comparing multiple runs of same benchmark)
   */
  async getReportsByName(name: string): Promise<BenchmarkMetadata[]> {
    const index = await this.loadIndex();
    return index
      .filter((m) => m.name === name)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Load the index of all benchmarks
   */
  private async loadIndex(): Promise<BenchmarkMetadata[]> {
    try {
      const data = await this.storage.getItem(INDEX_KEY);
      if (!data) return [];
      return JSON.parse(data) as BenchmarkMetadata[];
    } catch (error) {
      console.error("[BenchmarkStorage] Error loading index:", error);
      return [];
    }
  }
}

/**
 * Create a storage instance using AsyncStorage
 */
export function createAsyncStorageAdapter(): StorageAdapter | null {
  try {
    // Dynamic import to avoid hard dependency on AsyncStorage
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return {
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    };
  } catch {
    console.warn(
      "[BenchmarkStorage] @react-native-async-storage/async-storage not available. " +
        "Provide a custom storage adapter."
    );
    return null;
  }
}

/**
 * In-memory storage adapter (for testing or when AsyncStorage is not available)
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  };
}

export default BenchmarkStorage;
