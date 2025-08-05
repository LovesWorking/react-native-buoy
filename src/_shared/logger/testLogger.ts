import { add } from "./logDump";
import { ConsoleTransportEntry, LogLevel, LogType, Metadata } from "./types";

// Simple ID generator to replace nanoid
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Simple test logger for generating sample logs in the admin interface
 */
export class TestLogger {
  debug(message: string, metadata: Metadata = {}) {
    this.log(LogLevel.Debug, message, metadata, LogType.Debug);
  }

  info(message: string, metadata: Metadata = {}) {
    this.log(LogLevel.Info, message, metadata, LogType.Generic);
  }

  warn(message: string, metadata: Metadata = {}) {
    this.log(LogLevel.Warn, message, metadata, LogType.Generic);
  }

  error(error: Error, metadata: Metadata = {}) {
    this.log(LogLevel.Error, error, metadata, LogType.Error);
  }

  private log(
    level: LogLevel,
    message: string | Error,
    metadata: Metadata,
    type: LogType
  ) {
    const entry: ConsoleTransportEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level,
      message,
      metadata,
      type,
    };

    add(entry);
  }
}

// Export a default instance
export const testLogger = new TestLogger();
