import { useEffect, useState } from "react";
import { Text, TextStyle } from "react-native";
import { gameUIColors } from "../gameUI";

interface TimeDisplayProps {
  time: Date | string | number;
  format?: "relative" | "absolute" | "duration" | "mixed";
  updateInterval?: number;
  style?: TextStyle;
  showSeconds?: boolean;
  prefix?: string;
}

export function TimeDisplay({
  time,
  format = "relative",
  updateInterval = 60000,
  style,
  showSeconds = false,
  prefix,
}: TimeDisplayProps) {
  const [displayTime, setDisplayTime] = useState("");

  const formatRelativeTime = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  const formatAbsoluteTime = (date: Date, withSeconds: boolean): string => {
    if (withSeconds) {
      return date.toLocaleTimeString();
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  useEffect(() => {
    const formatMixed = (date: Date): string => {
      const now = Date.now();
      const diff = now - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours < 24) {
        return formatRelativeTime(date);
      }
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    };

    const updateTime = () => {
      if (format === "duration" && typeof time === "number") {
        setDisplayTime(formatDuration(time));
        return;
      }

      const date = new Date(time);

      switch (format) {
        case "relative":
          setDisplayTime(formatRelativeTime(date));
          break;
        case "absolute":
          setDisplayTime(formatAbsoluteTime(date, showSeconds));
          break;
        case "mixed":
          setDisplayTime(formatMixed(date));
          break;
        default:
          setDisplayTime(formatRelativeTime(date));
      }
    };

    updateTime();

    if (format === "relative" && updateInterval > 0) {
      const interval = setInterval(updateTime, updateInterval);
      return () => clearInterval(interval);
    }
  }, [time, format, updateInterval, showSeconds]);

  return (
    <Text style={[defaultStyles.text, style]}>
      {prefix ? `${prefix} ${displayTime}` : displayTime}
    </Text>
  );
}

interface TimestampProps {
  time: Date | string | number;
  style?: TextStyle;
}

TimeDisplay.Timestamp = function Timestamp({ time, style }: TimestampProps) {
  return <TimeDisplay time={time} format="mixed" style={style} />;
};

interface DurationProps {
  milliseconds: number;
  style?: TextStyle;
}

TimeDisplay.Duration = function Duration({
  milliseconds,
  style,
}: DurationProps) {
  return <TimeDisplay time={milliseconds} format="duration" style={style} />;
};

interface RelativeProps {
  time: Date | string;
  updateInterval?: number;
  style?: TextStyle;
}

TimeDisplay.Relative = function Relative({
  time,
  updateInterval = 60000,
  style,
}: RelativeProps) {
  return (
    <TimeDisplay
      time={time}
      format="relative"
      updateInterval={updateInterval}
      style={style}
    />
  );
};

const defaultStyles = {
  text: {
    fontSize: 12,
    color: gameUIColors.tertiary,
  },
};
