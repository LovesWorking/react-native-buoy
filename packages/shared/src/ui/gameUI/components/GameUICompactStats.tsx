import { ComponentType, Fragment } from "react";
import { StyleSheet, Text, View, ViewStyle, Animated } from "react-native";
import { gameUIColors } from "../constants/gameUIColors";

export interface StatCardConfig {
  key: string;
  label: string;
  subtitle: string;
  icon: ComponentType<{ size: number; color: string }>;
  color: string;
  value: number;
  showBar?: boolean;
  pulseDelay?: number;
}

export interface GameUICompactStatsProps {
  // Stats configuration array
  statsConfig: StatCardConfig[];
  // Total count for percentage calculations
  totalCount?: number;
  // Header configuration
  header?: {
    title: string;
    subtitle: string;
    healthPercentage?: number;
    healthStatus?: string;
    healthColor?: string;
  };
  // Bottom bar stats
  bottomStats?: {
    label: string;
    value: number | string;
    color?: string;
  }[];
  // Container style
  style?: ViewStyle;
  // Whether to show only active stats (value > 0)
  hideInactive?: boolean;
}

/**
 * Reusable compact stats display component
 * Shows stat cards with icons, labels, values, and optional progress bars
 * Used in ENV and Storage pages for metrics display
 */
export function GameUICompactStats({
  statsConfig,
  totalCount,
  header,
  bottomStats,
  style,
  hideInactive = true,
}: GameUICompactStatsProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Compact Header with Health */}
      {header && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{header.title}</Text>
            <Text style={styles.headerSubtitle}>{header.subtitle}</Text>
          </View>
          {header.healthPercentage !== undefined && (
            <View style={styles.headerRight}>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        header.healthColor || gameUIColors.success,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: header.healthColor || gameUIColors.success },
                  ]}
                >
                  {header.healthStatus || "OPTIMAL"}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Health Bar */}
      {header?.healthPercentage !== undefined && (
        <View style={styles.healthSection}>
          <Text style={styles.healthLabel}>SYSTEM HEALTH</Text>
          <View style={styles.healthBarWrapper}>
            <View style={styles.healthBarBg}>
              <Animated.View
                style={[
                  styles.healthBarFill,
                  {
                    width: `${header.healthPercentage}%`,
                    backgroundColor: header.healthColor || gameUIColors.success,
                  },
                ]}
              />
            </View>
          </View>
          <Text
            style={[
              styles.healthPercentage,
              { color: header.healthColor || gameUIColors.success },
            ]}
          >
            {header.healthPercentage}%
          </Text>
        </View>
      )}

      {/* Compact Stats Grid */}
      <View style={styles.statsGrid}>
        {statsConfig.map((stat) => {
          const isActive = stat.value > 0;
          if (hideInactive && !isActive) return null;

          const IconComponent = stat.icon;
          const percentage = totalCount ? (stat.value / totalCount) * 100 : 0;

          return (
            <Animated.View
              key={stat.key}
              style={[styles.statCard, { borderColor: stat.color + "30" }]}
            >
              <View style={styles.cardContent}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: stat.color + "1A",
                      borderColor: stat.color + "33",
                    },
                  ]}
                >
                  <IconComponent size={12} color={stat.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardLabel}>{stat.label}</Text>
                  <Text style={styles.cardSubtitle}>{stat.subtitle}</Text>
                </View>
                <View style={styles.valueBlock}>
                  <Text style={[styles.statNumber, { color: stat.color }]}>
                    {stat.value.toString().padStart(2, "0")}
                  </Text>
                  {totalCount ? (
                    <Text style={styles.percentText}>
                      {Math.round(percentage)}%
                    </Text>
                  ) : null}
                </View>
              </View>
              {stat.showBar !== false && totalCount && (
                <View
                  style={[
                    styles.statBar,
                    { backgroundColor: stat.color + "10" },
                  ]}
                >
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: stat.color,
                      },
                    ]}
                  />
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Bottom Stats Bar */}
      {bottomStats && bottomStats.length > 0 && (
        <View style={styles.bottomBar}>
          {bottomStats.map((stat, index) => (
            <Fragment key={stat.label}>
              <View style={styles.bottomStat}>
                <Text style={styles.bottomStatLabel}>{stat.label}</Text>
                <Text
                  style={[
                    styles.bottomStatValue,
                    stat.color && { color: stat.color },
                  ]}
                >
                  {stat.value}
                </Text>
              </View>
              {index < bottomStats.length - 1 && (
                <View style={styles.bottomDivider} />
              )}
            </Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    overflow: "hidden",
    position: "relative",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerLeft: {
    gap: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: gameUIColors.primary,
    fontFamily: "monospace",
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 8,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    opacity: 0.7,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },

  // Health section
  healthSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  healthLabel: {
    fontSize: 8,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  healthBarWrapper: {
    flex: 1,
  },
  healthBarBg: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 2,
    overflow: "hidden",
  },
  healthBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  healthPercentage: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },

  // Stats grid
  statsGrid: {
    gap: 6,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: gameUIColors.blackTint2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.border,
    padding: 10,
    marginBottom: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
    color: gameUIColors.primary,
  },
  cardSubtitle: {
    fontSize: 8,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    opacity: 0.7,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "monospace",
    minWidth: 28,
  },
  valueBlock: {
    alignItems: "flex-end",
  },
  percentText: {
    fontSize: 9,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
  },
  statBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 1.5,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.border + "40",
  },
  bottomStat: {
    flex: 1,
    alignItems: "center",
  },
  bottomStatLabel: {
    fontSize: 7,
    color: gameUIColors.muted,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  bottomStatValue: {
    fontSize: 11,
    fontWeight: "700",
    color: gameUIColors.primary,
    fontFamily: "monospace",
  },
  bottomDivider: {
    width: 1,
    height: 16,
    backgroundColor: gameUIColors.border + "40",
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
