import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from "react-native";
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "rn-better-dev-tools/icons";
import { gameUIColors } from "../constants/gameUIColors";

export interface IssueItem {
  key: string;
  status: "missing" | "wrong_type" | "wrong_value";
  value?: unknown;
  expectedType?: string;
  expectedValue?: string;
  description?: string;
  fixSuggestion?: string;
}

export interface GameUIIssuesListProps {
  // Array of issues to display
  issues: IssueItem[];
  // Optional callback when issue is clicked
  onIssueClick?: (issue: IssueItem) => void;
  // Optional hint text at bottom
  hintText?: string;
  // Container style
  style?: ViewStyle;
  // Whether to show expandable details
  expandable?: boolean;
  // Custom status labels
  statusLabels?: {
    missing?: string;
    wrong_type?: string;
    wrong_value?: string;
  };
}

/**
 * Reusable issues list component with expandable details
 * Shows validation errors in a compact, game-styled format
 * Used in ENV and Storage pages for displaying problems
 */
export function GameUIIssuesList({
  issues,
  onIssueClick,
  hintText = "Tap any issue to view details",
  style,
  expandable = true,
  statusLabels = {
    missing: "Not found",
    wrong_type: "Type error",
    wrong_value: "Invalid value",
  },
}: GameUIIssuesListProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const toggleIssue = useCallback(
    (key: string) => {
      if (!expandable) return;
      setExpandedIssues((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    },
    [expandable],
  );

  const getStatusColor = (status: IssueItem["status"]) => {
    return status === "missing" ? gameUIColors.warning : gameUIColors.info;
  };

  const getStatusIcon = (status: IssueItem["status"]) => {
    return status === "missing" ? AlertOctagon : AlertTriangle;
  };

  const getStatusLabel = (issue: IssueItem) => {
    switch (issue.status) {
      case "missing":
        return `• ${statusLabels.missing}`;
      case "wrong_type":
        return `• ${statusLabels.wrong_type}${
          issue.expectedType ? `: Expected ${issue.expectedType}` : ""
        }`;
      case "wrong_value":
        return `• ${statusLabels.wrong_value}${
          issue.value ? `: ${String(issue.value).substring(0, 20)}` : ""
        }`;
      default:
        return "";
    }
  };

  if (issues.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {issues.map((issue, index) => {
        const statusColor = getStatusColor(issue.status);
        const StatusIcon = getStatusIcon(issue.status);
        const isExpanded = expandedIssues.has(issue.key);
        const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

        return (
          <View key={`${issue.key}-${index}`}>
            <TouchableOpacity
              onPress={() => {
                if (expandable) {
                  toggleIssue(issue.key);
                }
                onIssueClick?.(issue);
              }}
              style={styles.issueRow}
              activeOpacity={0.7}
            >
              <StatusIcon size={14} color={statusColor} />
              <View style={styles.issueContent}>
                <Text
                  style={[styles.issueKey, { color: gameUIColors.primary }]}
                >
                  {issue.key}
                </Text>
                <Text style={styles.issueDesc}>{getStatusLabel(issue)}</Text>
              </View>
              {expandable && (
                <ChevronIcon size={12} color={gameUIColors.muted} />
              )}
            </TouchableOpacity>

            {expandable && isExpanded && (
              <Animated.View style={styles.issueDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: gameUIColors.primary, fontWeight: "600" },
                    ]}
                  >
                    {issue.status === "missing" && "MISSING"}
                    {issue.status === "wrong_type" && "TYPE ERROR"}
                    {issue.status === "wrong_value" && "INVALID VALUE"}
                  </Text>
                </View>

                {issue.value !== undefined && issue.status !== "missing" && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: gameUIColors.warning },
                      ]}
                    >
                      {`"${String(issue.value)}"`}
                    </Text>
                  </View>
                )}

                {issue.expectedType && issue.status === "wrong_type" && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: gameUIColors.success },
                      ]}
                    >
                      {issue.expectedType}
                    </Text>
                  </View>
                )}

                {issue.expectedValue && issue.status === "wrong_value" && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: gameUIColors.success },
                      ]}
                    >
                      {`"${issue.expectedValue}"`}
                    </Text>
                  </View>
                )}

                {issue.description && (
                  <View style={styles.descSection}>
                    <Text style={styles.descText}>{issue.description}</Text>
                  </View>
                )}

                {issue.fixSuggestion && (
                  <View style={styles.fixSection}>
                    <Text style={styles.fixLabel}>HOW TO FIX</Text>
                    <Text style={styles.fixText}>{issue.fixSuggestion}</Text>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        );
      })}

      {hintText && <Text style={styles.hint}>{hintText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: gameUIColors.warning + "33",
  },
  issueRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  issueContent: {
    flex: 1,
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  issueKey: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  issueDesc: {
    fontSize: 10,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    flex: 1,
  },
  hint: {
    fontSize: 9,
    color: gameUIColors.muted,
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.primary + "0D",
  },

  // Expanded details
  issueDetails: {
    marginTop: 8,
    marginLeft: 22,
    marginRight: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: gameUIColors.background + "4D",
    borderLeftWidth: 2,
    borderLeftColor: gameUIColors.primary + "1A",
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 10,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    fontWeight: "600",
    width: 70,
  },
  detailValue: {
    fontSize: 11,
    color: gameUIColors.primary,
    fontFamily: "monospace",
    flex: 1,
    lineHeight: 16,
  },
  fixSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: gameUIColors.info + "14",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.info + "33",
  },
  fixLabel: {
    fontSize: 10,
    color: gameUIColors.info,
    fontFamily: "monospace",
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  fixText: {
    fontSize: 11,
    color: gameUIColors.primary,
    fontFamily: "monospace",
    lineHeight: 18,
    backgroundColor: gameUIColors.background + "66",
    padding: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  descSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.primary + "0D",
  },
  descText: {
    fontSize: 10,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
    marginTop: 4,
    lineHeight: 14,
  },
});
