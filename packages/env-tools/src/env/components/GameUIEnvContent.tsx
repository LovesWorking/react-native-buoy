import { useMemo } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { CheckCircle2, Search, gameUIColors, displayValue, type IssueItem } from "@monorepo/shared";

// Import shared Game UI components
 

// Local imports
import { useDynamicEnv } from "../hooks/useDynamicEnv";
import { RequiredEnvVar } from "../types";
import { processEnvVars, calculateStats } from "../utils";
import { EnvVarSection } from "./EnvVarSection";
import { EnvStatsOverview } from "./EnvStatsOverview";
 

interface GameUIEnvContentProps {
  requiredEnvVars?: RequiredEnvVar[];
  activeTab?: string;
  searchQuery?: string;
}

export function GameUIEnvContent({
  requiredEnvVars,
  activeTab = "overview",
  searchQuery = "",
}: GameUIEnvContentProps) {
  // No internal tab state needed anymore

  // Auto-collect environment variables
  const envResults = useDynamicEnv();

  const autoCollectedEnvVars = useMemo(() => {
    // Normal operation
    const envVars: Record<string, string> = {};
    envResults.forEach(({ key, data }) => {
      if (data !== undefined && data !== null) {
        envVars[key] = typeof data === "string" ? data : displayValue(data);
      }
    });
    return envVars;
  }, [envResults]);

  // Process and categorize environment variables
  const { requiredVars, optionalVars } = useMemo(() => {
    return processEnvVars(autoCollectedEnvVars, requiredEnvVars);
  }, [autoCollectedEnvVars, requiredEnvVars]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (requiredEnvVars === undefined) {
      return {
        totalCount: 0,
        requiredCount: 0,
        optionalCount: 0,
        presentRequiredCount: 0,
        missingCount: 0,
        wrongValueCount: 0,
        wrongTypeCount: 0,
      };
    }
    return calculateStats(requiredVars, optionalVars, autoCollectedEnvVars);
  }, [requiredEnvVars, requiredVars, optionalVars, autoCollectedEnvVars]);

  // Filter variables based on search query
  const filteredRequiredVars = useMemo(() => {
    if (!searchQuery) return requiredVars;
    const query = searchQuery.toLowerCase();
    return requiredVars.filter(
      (v) =>
        v.key.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        (typeof v.value === "string" && v.value.toLowerCase().includes(query))
    );
  }, [requiredVars, searchQuery]);

  const filteredOptionalVars = useMemo(() => {
    if (!searchQuery) return optionalVars;
    const query = searchQuery.toLowerCase();
    return optionalVars.filter(
      (v) =>
        v.key.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        (typeof v.value === "string" && v.value.toLowerCase().includes(query))
    );
  }, [optionalVars, searchQuery]);

  // Get vars with issues for the issues section (from filtered vars)
  const issueVars = useMemo(() => {
    return filteredRequiredVars.filter((v) => v.status !== "required_present");
  }, [filteredRequiredVars]);

  // Transform issues for compatibility (kept for stats)
  const issues = useMemo<IssueItem[]>(() => {
    return issueVars.map((varItem) => ({
      key: varItem.key,
      status:
        varItem.status === "required_missing"
          ? "missing"
          : varItem.status === "required_wrong_type"
          ? "wrong_type"
          : "wrong_value",
      value: varItem.value,
      expectedType: varItem.expectedType,
      expectedValue: varItem.expectedValue as string,
      description: varItem.description,
      fixSuggestion:
        varItem.status === "required_missing"
          ? `Add to .env: ${varItem.key}=your_value_here`
          : varItem.status === "required_wrong_type"
          ? `Update type to ${varItem.expectedType} in .env file`
          : `Check valid values for ${varItem.key}`,
    }));
  }, [issueVars]);

  // Calculate health percentage based on required variables only
  const healthPercentage =
    stats.requiredCount > 0
      ? Math.round((stats.presentRequiredCount / stats.requiredCount) * 100)
      : 100; // If no required vars, health is 100%

  const healthStatus =
    healthPercentage === 100
      ? "HEALTHY"
      : healthPercentage >= 75
      ? "WARNING"
      : healthPercentage >= 50
      ? "ERROR"
      : "CRITICAL";

  const healthColor =
    healthPercentage === 100
      ? gameUIColors.success
      : healthPercentage >= 75
      ? gameUIColors.warning
      : healthPercentage >= 50
      ? gameUIColors.error
      : gameUIColors.error;

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        // Overview tab shows simplified stats + issues
        return (
          <View style={styles.overviewContainer}>
            {/* Stats Overview using new component */}
            <EnvStatsOverview
              stats={stats}
              healthPercentage={healthPercentage}
              healthStatus={healthStatus}
              healthColor={healthColor}
            />

            {/* Issues Section using reusable EnvVarSection */}
            {issues.length > 0 ? (
              <View style={styles.issuesSection}>
                <View style={styles.issuesSectionHeader}>
                  <Text style={styles.issuesSectionTitle}>ISSUES TO FIX</Text>
                  <View style={styles.issuesCount}>
                    <Text style={styles.issuesCountText}>{issues.length}</Text>
                  </View>
                </View>
                <EnvVarSection
                  title=""
                  count={0}
                  vars={issueVars}
                  emptyMessage={
                    searchQuery
                      ? `No issues matching "${searchQuery}"`
                      : "All issues resolved"
                  }
                />
              </View>
            ) : searchQuery ? (
              <View style={styles.emptyState}>
                <Search size={48} color={gameUIColors.muted} />
                <Text style={styles.emptyTitle}>No search results</Text>
                <Text style={styles.emptySubtitle}>
                  No issues found matching &quot;{searchQuery}&quot;
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color={gameUIColors.success} />
                <Text style={styles.emptyTitle}>No Issues Found</Text>
                <Text style={styles.emptySubtitle}>
                  All environment variables are correctly configured
                </Text>
              </View>
            )}
          </View>
        );

      case "required":
        return (
          <EnvVarSection
            title=""
            count={0}
            vars={filteredRequiredVars}
            emptyMessage={
              searchQuery
                ? `No required variables matching "${searchQuery}"`
                : "No required variables configured"
            }
          />
        );

      case "optional":
        return (
          <EnvVarSection
            title=""
            count={0}
            vars={filteredOptionalVars}
            emptyMessage={
              searchQuery
                ? `No optional variables matching "${searchQuery}"`
                : "No optional variables detected"
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.backgroundGrid} />

      {/* Tab Content - Stats only shown in overview */}
      {renderTabContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: gameUIColors.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: gameUIColors.background,
  },
  backgroundGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    backgroundColor: gameUIColors.info,
  },
  overviewContainer: {
    flex: 1,
  },
  statsContainer: {
    gap: 12,
  },
  // Cyberpunk Health Card Styles
  cyberHealthCard: {
    backgroundColor: gameUIColors.background + "95",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: gameUIColors.info + "30",
    overflow: "hidden",
    position: "relative",
  },
  cyberHealthGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: gameUIColors.info,
    opacity: 0.6,
  },
  cyberHealthContent: {
    padding: 12,
  },
  cyberHealthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cyberHealthLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.muted,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  cyberHealthRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cyberHealthPercent: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  cyberHealthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 2,
    backgroundColor: gameUIColors.background + "40",
  },
  cyberHealthBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  cyberHealthStatus: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },
  cyberHealthBarContainer: {
    position: "relative",
    height: 4,
    backgroundColor: gameUIColors.background + "80",
    borderRadius: 1,
    overflow: "hidden",
  },
  cyberHealthBarTrack: {
    position: "absolute",
    flexDirection: "row",
    width: "100%",
    height: "100%",
    gap: 2,
  },
  cyberHealthBarSegment: {
    flex: 1,
    backgroundColor: gameUIColors.info,
    borderRadius: 1,
  },
  cyberHealthBarFill: {
    position: "absolute",
    height: "100%",
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  // Cyberpunk Stats Grid Styles
  cyberStatsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  cyberStatItem: {
    flex: 1,
    backgroundColor: gameUIColors.background + "95",
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  cyberStatGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  cyberStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: gameUIColors.text,
    fontFamily: "monospace",
    marginBottom: 2,
  },
  cyberStatLabel: {
    fontSize: 8,
    color: gameUIColors.muted,
    letterSpacing: 0.8,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  cyberStatIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  // Issues Section Styles
  issuesSection: {
    marginTop: 16,
  },
  issuesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  issuesSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.muted,
    letterSpacing: 1.2,
    fontFamily: "monospace",
  },
  issuesCount: {
    backgroundColor: gameUIColors.error + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: gameUIColors.error + "30",
  },
  issuesCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.error,
    fontFamily: "monospace",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: gameUIColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: gameUIColors.secondary,
    textAlign: "center",
  },
});
