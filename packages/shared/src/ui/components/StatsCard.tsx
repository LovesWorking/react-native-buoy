import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LucideIcon } from "rn-better-dev-tools/icons";
import { gameUIColors } from "../gameUI";

interface StatsCardProps {
  children: ReactNode;
  style?: ViewStyle;
  title?: string;
}

export function StatsCard({ children, style, title }: StatsCardProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
}

interface GridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  style?: ViewStyle;
}

StatsCard.Grid = function Grid({ children, columns = 4, style }: GridProps) {
  const gridStyles = {
    2: styles.grid2,
    3: styles.grid3,
    4: styles.grid4,
  };

  return (
    <View style={[styles.grid, gridStyles[columns], style]}>{children}</View>
  );
};

interface ItemProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  color?: "success" | "error" | "warning" | "info" | "primary" | string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

StatsCard.Item = function Item({
  icon: Icon,
  label,
  value,
  color = "primary",
  size = "medium",
  style,
  labelStyle,
  valueStyle,
}: ItemProps) {
  const colorMap: Record<string, string> = {
    success: gameUIColors.success,
    error: gameUIColors.error,
    warning: gameUIColors.warning,
    info: gameUIColors.primary,
    primary: gameUIColors.primary,
  };

  const finalColor = colorMap[color] || color;

  const sizeConfig = {
    small: {
      iconSize: 12,
      valueSize: 16,
      labelSize: 10,
    },
    medium: {
      iconSize: 14,
      valueSize: 20,
      labelSize: 11,
    },
    large: {
      iconSize: 16,
      valueSize: 24,
      labelSize: 12,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.statHeader}>
        {Icon && <Icon size={config.iconSize} color={finalColor} />}
        <Text
          style={[styles.statLabel, { fontSize: config.labelSize }, labelStyle]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.statValue,
          { fontSize: config.valueSize, color: finalColor },
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
};

interface RowProps {
  children: ReactNode;
  style?: ViewStyle;
}

StatsCard.Row = function Row({ children, style }: RowProps) {
  return <View style={[styles.row, style]}>{children}</View>;
};

interface DividerProps {
  style?: ViewStyle;
}

StatsCard.Divider = function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
};

interface SectionProps {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
}

StatsCard.Section = function Section({ title, children, style }: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: gameUIColors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  grid2: {
    justifyContent: "space-between",
  },
  grid3: {
    justifyContent: "space-between",
  },
  grid4: {
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: gameUIColors.background + "40",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: gameUIColors.border + "20",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  statLabel: {
    color: gameUIColors.secondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: gameUIColors.border + "20",
    marginVertical: 8,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: gameUIColors.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
