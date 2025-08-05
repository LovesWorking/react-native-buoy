import {
  Box,
  Bug,
  Database,
  Globe,
  Hand,
  Key,
  Palette,
  Play,
  Route,
  Settings,
  TriangleAlert,
  User,
} from "lucide-react-native";

import { ConsoleTransportEntry, LogLevel, LogType } from "../../_shared/logger/types";

// Helper functions - moved outside component to be stable
export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};
// Add new helper functions for type styling
export const getTypeIcon = (type: string) => {
  switch (type) {
    case "Auth":
      return Key;
    case "Custom":
      return Palette;
    case "Debug":
      return Bug;
    case "Error":
      return TriangleAlert;
    case "Generic":
      return Box;
    case "HTTP Request":
      return Globe;
    case "Navigation":
      return Route;
    case "Replay":
      return Play;
    case "State":
      return Database;
    case "System":
      return Settings;
    case "Touch":
      return Hand;
    case "User Action":
      return User;
    default:
      return Box;
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case "Auth":
      return "#F59E0B"; // yellow-500
    case "Custom":
      return "#06B6D4"; // cyan-500
    case "Debug":
      return "#60A5FA"; // blue-400
    case "Error":
      return "#F87171"; // red-400
    case "Generic":
      return "#94A3B8"; // slate-400
    case "HTTP Request":
      return "#2DD4BF"; // teal-400
    case "Navigation":
      return "#34D399"; // emerald-400
    case "Replay":
      return "#EC4899"; // pink-500
    case "State":
      return "#8B5CF6"; // purple-500
    case "System":
      return "#A78BFA"; // violet-400
    case "Touch":
      return "#FBBF24"; // amber-400
    case "User Action":
      return "#FB923C"; // orange-400
    default:
      return "#94A3B8"; // slate-400
  }
};

// Helper functions for log dump components
const formatCount = (count: number) => {
  if (count === 0) return "";
  if (count > 99) return " (99+)";
  return ` (${count})`;
};

export const getTypeCount = (
  entries: ConsoleTransportEntry[],
  type: LogType
) => {
  return formatCount(entries.filter((entry) => entry.type === type).length);
};

export const getLevelCount = (
  entries: ConsoleTransportEntry[],
  level: LogLevel
) => {
  return formatCount(entries.filter((entry) => entry.level === level).length);
};

// Level styling utilities
export const getLevelDotStyle = (level: string) => {
  switch (level) {
    case "error":
      return { backgroundColor: "#F87171" }; // red-400
    case "warn":
      return { backgroundColor: "#FBBF24" }; // yellow-400
    case "info":
      return { backgroundColor: "#22D3EE" }; // cyan-400
    case "debug":
      return { backgroundColor: "#60A5FA" }; // blue-400
    default:
      return { backgroundColor: "#9CA3AF" }; // gray-400
  }
};

export const getLevelTextColor = (level: string) => {
  switch (level) {
    case "error":
      return "#F87171"; // red-400
    case "warn":
      return "#FBBF24"; // yellow-400
    case "info":
      return "#22D3EE"; // cyan-400
    case "debug":
      return "#60A5FA"; // blue-400
    default:
      return "#9CA3AF"; // gray-400
  }
};

export const getLevelBorderColor = (level: string) => {
  switch (level) {
    case "error":
      return "#F87171"; // red-400
    case "warn":
      return "#FBBF24"; // yellow-400
    case "info":
      return "#10B981"; // emerald-500 - changed from cyan for better contrast
    case "debug":
      return "#8B5CF6"; // violet-500 - changed from blue for better contrast
    default:
      return "#6B7280"; // gray-500
  }
};
