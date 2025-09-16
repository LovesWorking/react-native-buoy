import { ReactNode, createContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { gameUIColors } from "../gameUI";

interface EventListItemProps extends TouchableOpacityProps {
  children: ReactNode;
  style?: ViewStyle;
}

interface EventListItemContextValue {
  isPressed?: boolean;
}

const EventListItemContext = createContext<EventListItemContextValue>({});

export function EventListItem({
  children,
  style,
  ...props
}: EventListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={0.7}
      {...props}
    >
      <EventListItemContext.Provider value={{}}>
        {children}
      </EventListItemContext.Provider>
    </TouchableOpacity>
  );
}

interface StatusProps {
  status: "success" | "error" | "warning" | "pending" | "info";
  size?: "small" | "medium" | "large";
}

EventListItem.Status = function Status({
  status,
  size = "small",
}: StatusProps) {
  const colors = {
    success: gameUIColors.success,
    error: gameUIColors.error,
    warning: gameUIColors.warning,
    pending: gameUIColors.warning,
    info: gameUIColors.primary,
  };

  const sizes = {
    small: 8,
    medium: 10,
    large: 12,
  };

  return (
    <View style={styles.statusContainer}>
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: colors[status],
            width: sizes[size],
            height: sizes[size],
            borderRadius: sizes[size] / 2,
          },
        ]}
      />
    </View>
  );
};

interface MainProps {
  children: ReactNode;
  style?: ViewStyle;
}

EventListItem.Main = function Main({ children, style }: MainProps) {
  return <View style={[styles.main, style]}>{children}</View>;
};

interface TitleProps {
  children: ReactNode;
  numberOfLines?: number;
  style?: TextStyle;
}

EventListItem.Title = function Title({
  children,
  numberOfLines = 1,
  style,
}: TitleProps) {
  return (
    <Text style={[styles.title, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};

interface DescriptionProps {
  children: ReactNode;
  numberOfLines?: number;
  style?: TextStyle;
}

EventListItem.Description = function Description({
  children,
  numberOfLines = 2,
  style,
}: DescriptionProps) {
  return (
    <Text style={[styles.description, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};

interface MetadataProps {
  children: ReactNode;
  style?: ViewStyle;
}

EventListItem.Metadata = function Metadata({ children, style }: MetadataProps) {
  return <View style={[styles.metadata, style]}>{children}</View>;
};

interface TimestampProps {
  time: Date | string | number;
  format?: "relative" | "absolute" | "duration";
  style?: TextStyle;
}

EventListItem.Timestamp = function Timestamp({
  time,
  format = "relative",
  style,
}: TimestampProps) {
  const formatTime = () => {
    if (format === "duration" && typeof time === "number") {
      return `${time}ms`;
    }

    const date = new Date(time);
    if (format === "absolute") {
      return date.toLocaleTimeString();
    }

    // Relative time
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return <Text style={[styles.timestamp, style]}>{formatTime()}</Text>;
};

interface SizeProps {
  bytes?: number;
  style?: TextStyle;
}

EventListItem.Size = function Size({ bytes, style }: SizeProps) {
  if (!bytes) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return <Text style={[styles.size, style]}>{formatBytes(bytes)}</Text>;
};

interface BadgeProps {
  children: ReactNode;
  color?: string;
  style?: ViewStyle;
}

EventListItem.Badge = function Badge({ children, color, style }: BadgeProps) {
  return (
    <View
      style={[styles.badge, color ? { backgroundColor: color } : {}, style]}
    >
      {typeof children === "string" ? (
        <Text style={styles.badgeText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

interface HeaderProps {
  children: ReactNode;
  style?: ViewStyle;
}

EventListItem.Header = function Header({ children, style }: HeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
};

interface FooterProps {
  children: ReactNode;
  style?: ViewStyle;
}

EventListItem.Footer = function Footer({ children, style }: FooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  statusContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
  statusDot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  main: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: gameUIColors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: gameUIColors.secondary,
    lineHeight: 16,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestamp: {
    fontSize: 11,
    color: gameUIColors.tertiary,
  },
  size: {
    fontSize: 11,
    color: gameUIColors.tertiary,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: gameUIColors.primary + "20",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: gameUIColors.primary,
    textTransform: "uppercase",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
});
