/**
 * RoutesSitemap - Visual sitemap of all app routes
 *
 * Displays parsed route information from Expo Router with:
 * - Search/filter
 * - Organized groups
 * - Route details
 * - Copy to clipboard
 * - Navigation
 */

import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  macOSColors,
  Search,
  ChevronDown,
  ChevronRight,
  InlineCopyButton,
  ToolbarCopyButton,
  RefreshCw,
  formatRelativeTime,
} from "@react-buoy/shared-ui";
import { useRouteSitemap } from "../useRouteSitemap";
import type { RouteInfo, RouteGroup } from "../RouteParser";

// ============================================================================
// Types
// ============================================================================

export interface RoutesSitemapProps {
  style?: any;
}

interface RouteGroupViewProps {
  group: RouteGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavigate: (route: RouteInfo) => void;
}

interface RouteItemViewProps {
  route: RouteInfo;
  depth?: number;
  onNavigate: (route: RouteInfo) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function RoutesSitemap({ style }: RoutesSitemapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Root Routes", "Dynamic Routes"])
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const router = useRouter();

  const {
    groups,
    stats,
    isLoaded,
    filteredRoutes,
    routes,
    refresh,
    lastUpdatedAt,
    source,
  } = useRouteSitemap({
    searchQuery,
    sortBy: "path",
  });

  // Prepare copy data - memoized so it only rebuilds when dependencies change
  const copyAllData = useMemo(() => {
    return {
      summary: {
        total: stats.total,
        static: stats.static,
        dynamic: stats.dynamic,
        layouts: stats.layouts,
        groups: stats.groups,
        timestamp: new Date().toISOString(),
      },
      groups: groups.map((group) => ({
        title: group.title,
        description: group.description,
        count: group.routes.length,
        routes: group.routes.map((route) => ({
          path: route.path,
          name: route.name,
          type: route.type,
          params: route.params,
          depth: route.depth,
          hasChildren: route.children.length > 0,
          childrenCount: route.children.length,
        })),
      })),
      allRoutes: routes.map((route) => route.path),
    };
  }, [groups, stats, routes]);

  const handleToggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  }, []);

  const promptForParams = useCallback(
    (
      route: RouteInfo,
      paramIndex: number = 0,
      collectedParams: Record<string, string> = {}
    ) => {
      const params = route.params;

      if (paramIndex >= params.length) {
        // All parameters collected, build path and navigate
        let finalPath = route.path;

        // Replace each parameter in the path
        Object.entries(collectedParams).forEach(([param, value]) => {
          if (route.type === "catch-all") {
            // For catch-all routes, replace [...param] with the value
            finalPath = finalPath.replace(`[...${param}]`, value);
          } else {
            // For regular dynamic routes, replace [param] with the value
            finalPath = finalPath.replace(`[${param}]`, value);
          }
        });

        // Navigate
        try {
          router.push(finalPath as any);
        } catch (error) {
          Alert.alert("Navigation Error", String(error));
        }
        return;
      }

      const currentParam = params[paramIndex];
      const paramDisplay =
        route.type === "catch-all"
          ? `[...${currentParam}]`
          : `[${currentParam}]`;

      Alert.prompt(
        "Enter Parameter Value",
        `Enter value for ${paramDisplay}:\n\nRoute: ${route.path}`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: paramIndex < params.length - 1 ? "Next" : "Navigate",
            onPress: (value?: string) => {
              if (value && value.trim()) {
                const newParams = {
                  ...collectedParams,
                  [currentParam]: value.trim(),
                };
                promptForParams(route, paramIndex + 1, newParams);
              } else {
                Alert.alert(
                  "Invalid Value",
                  "Please enter a value for the parameter"
                );
              }
            },
          },
        ],
        "plain-text"
      );
    },
    [router]
  );

  const handleNavigate = useCallback(
    (route: RouteInfo) => {
      // Don't navigate to layouts or groups
      if (route.type === "layout" || route.type === "group") {
        Alert.alert(
          "Cannot Navigate",
          `${
            route.type === "layout" ? "Layouts" : "Route groups"
          } are not navigable routes`
        );
        return;
      }

      // For dynamic routes, prompt for parameters
      if (route.type === "dynamic" || route.type === "catch-all") {
        if (route.params.length === 0) {
          // No parameters despite being dynamic? Just navigate
          try {
            router.push(route.path as any);
          } catch (error) {
            Alert.alert("Navigation Error", String(error));
          }
          return;
        }

        // Start the parameter prompting flow
        promptForParams(route);
        return;
      }

      // Navigate to static route
      try {
        router.push(route.path as any);
      } catch (error) {
        Alert.alert("Navigation Error", String(error));
      }
    },
    [router, promptForParams]
  );

  const handleManualRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 400);
  }, [isRefreshing, refresh]);

  const lastRefreshLabel = useMemo(() => {
    if (!lastUpdatedAt) return "Awaiting route data";
    return `Updated ${formatRelativeTime(lastUpdatedAt)}`;
  }, [lastUpdatedAt]);

  const sourceLabel = useMemo(() => {
    if (!source) return "Source: unknown";
    return `Source: ${source}`;
  }, [source]);

  // When searching, show filtered routes, otherwise show groups
  const displayGroups = useMemo(() => {
    if (searchQuery && filteredRoutes.length > 0) {
      // Create a single "Search Results" group
      return [
        {
          title: "Search Results",
          icon: "",
          routes: filteredRoutes,
        },
      ];
    }
    return groups;
  }, [searchQuery, filteredRoutes, groups]);

  if (!isLoaded) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header with actions and stats */}
      {!isSearching ? (
        <View style={styles.header}>
          {/* Action buttons row - Copy, Refresh, Search */}
          <View style={styles.actionsRow}>
            <View style={styles.actionWrapper}>
              <ToolbarCopyButton
                value={copyAllData}
                buttonStyle={styles.actionButtonHeader}
              />
              <Text style={styles.actionLabel}>Copy</Text>
            </View>
            <View style={styles.actionWrapper}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  isRefreshing && styles.refreshButtonDisabled,
                ]}
                onPress={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  size={16}
                  color={
                    isRefreshing
                      ? macOSColors.text.muted
                      : macOSColors.text.secondary
                  }
                />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Refresh</Text>
            </View>
            <View style={styles.actionWrapper}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsSearching(true)}
              >
                <Search size={16} color={macOSColors.text.secondary} />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Search</Text>
            </View>
          </View>

          {/* Stats cards row - wrapping */}
          <View style={styles.statsGrid}>
            <StatItem value={stats.total} label="Total" />
            <StatItem value={stats.static} label="Static" />
            <StatItem value={stats.dynamic} label="Dynamic" />
            <StatItem value={stats.catchAll} label="Catch-All" />
            <StatItem value={stats.layouts} label="Layouts" />
            <StatItem value={stats.groups} label="Groups" />
          </View>
        </View>
      ) : (
        /* Search mode - full width search bar */
        <View style={styles.searchContainer}>
          <Search size={16} color={macOSColors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes..."
            placeholderTextColor={macOSColors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeSearchButton}
            onPress={() => {
              setIsSearching(false);
              setSearchQuery("");
            }}
          >
            <Text style={styles.closeSearchText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Route groups */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {displayGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No routes found</Text>
          </View>
        ) : (
          displayGroups.map((group) => (
            <RouteGroupView
              key={group.title}
              group={group}
              isExpanded={
                searchQuery.length > 0 || expandedGroups.has(group.title)
              }
              onToggleExpand={() => handleToggleGroup(group.title)}
              onNavigate={handleNavigate}
            />
          ))
        )}

        {/* Meta information at bottom - Updated and Source */}
        <View style={styles.metaFooter}>
          <Text style={styles.metaText}>{lastRefreshLabel}</Text>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>{sourceLabel}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RouteGroupView({
  group,
  isExpanded,
  onToggleExpand,
  onNavigate,
}: RouteGroupViewProps) {
  return (
    <View style={styles.groupContainer}>
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.groupHeaderLeft}>
          {isExpanded ? (
            <ChevronDown size={14} color={macOSColors.text.secondary} />
          ) : (
            <ChevronRight size={14} color={macOSColors.text.secondary} />
          )}
          <Text style={styles.groupTitle}>{group.title}</Text>
        </View>
        <View style={styles.groupBadge}>
          <Text style={styles.groupCount}>{group.routes.length}</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.routesList}>
          {group.description && (
            <View style={styles.groupDescription}>
              <Text style={styles.groupDescriptionText}>{group.description}</Text>
            </View>
          )}
          {group.routes.map((route, index) => (
            <RouteItemView
              key={`${route.path}-${index}`}
              route={route}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function RouteItemView({
  route,
  depth = 0,
  onNavigate,
}: RouteItemViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = route.children.length > 0;
  const hasParams = route.params.length > 0;

  const typeColor = getRouteTypeColor(route.type);
  const canNavigate = route.type !== "layout" && route.type !== "group";

  return (
    <View style={[styles.routeItem, { marginLeft: depth * 12 }]}>
      {/* Compact header - always visible */}
      <View style={styles.routeCard}>
        <TouchableOpacity
          style={styles.routeHeaderLeft}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.expandIndicator}>
            {isExpanded ? (
              <ChevronDown size={14} color={macOSColors.text.secondary} />
            ) : (
              <ChevronRight size={14} color={macOSColors.text.secondary} />
            )}
          </View>
          <Text style={styles.routePath} numberOfLines={1}>
            {route.path}
          </Text>
        </TouchableOpacity>

        {/* Header badges only */}
        <View style={styles.routeHeaderActions}>
          {hasChildren && (
            <View style={styles.childCountBadge}>
              <Text style={styles.childCountText}>{route.children.length}</Text>
            </View>
          )}

          <View
            style={[
              styles.typeTag,
              {
                backgroundColor: `${typeColor}15`,
                borderColor: `${typeColor}40`,
              },
            ]}
          >
            <Text style={[styles.typeText, { color: typeColor }]}>
              {route.type.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded details */}
      {isExpanded && (
        <View style={styles.routeDetails}>
          {/* Action buttons in expanded content */}
          <View style={styles.routeButtons}>
            <InlineCopyButton
              value={route.path}
              buttonStyle={styles.actionButton}
            />

            {canNavigate && (
              <TouchableOpacity
                style={[styles.actionButton, styles.navigateButton]}
                onPress={() => onNavigate(route)}
              >
                <Text style={styles.navigateButtonText}>Go</Text>
              </TouchableOpacity>
            )}
          </View>

          {hasParams && (
            <View style={styles.paramsContainer}>
              <Text style={styles.paramsLabel}>Parameters:</Text>
              <View style={styles.paramsRow}>
                {route.params.map((param) => (
                  <View key={param} style={styles.paramTag}>
                    <Text style={styles.paramText}>{param}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Children routes */}
          {hasChildren && (
            <View style={styles.childrenContainer}>
              {route.children.map((child, index) => (
                <RouteItemView
                  key={`${child.path}-${index}`}
                  route={child}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getRouteTypeColor(type: RouteInfo["type"]): string {
  switch (type) {
    case "static":
      return "#3B82F6"; // Blue
    case "dynamic":
      return "#F59E0B"; // Orange
    case "catch-all":
      return "#EC4899"; // Pink
    case "index":
      return "#10B981"; // Green
    case "layout":
      return "#8B5CF6"; // Purple
    case "group":
      return "#6366F1"; // Indigo
    case "not-found":
      return "#EF4444"; // Red
    default:
      return "#6B7280"; // Gray
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: "monospace",
  },

  header: {
    flexDirection: "column",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
    gap: 12,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingBottom: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "30%",
    minWidth: 90,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
  },

  statLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    marginTop: 4,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  actionWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 48,
  },

  actionButtonHeader: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: macOSColors.background.input,
  },

  iconButton: {
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  actionLabel: {
    fontSize: 8,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },

  metaFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },

  metaText: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },

  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    backgroundColor: macOSColors.background.card,
  },

  sourceText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    textTransform: "capitalize",
    fontFamily: "monospace",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },

  searchInput: {
    flex: 1,
    color: macOSColors.text.primary,
    fontSize: 14,
    fontFamily: "monospace",
  },

  clearButton: {
    padding: 4,
  },

  clearButtonText: {
    color: macOSColors.text.muted,
    fontSize: 18,
  },

  closeSearchButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  closeSearchText: {
    color: macOSColors.semantic.info,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingVertical: 8,
  },

  emptyState: {
    padding: 32,
    alignItems: "center",
  },

  emptyText: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: "monospace",
  },

  groupContainer: {
    marginVertical: 4,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: macOSColors.background.card,
    borderLeftWidth: 3,
    borderLeftColor: macOSColors.semantic.info,
  },

  groupHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  groupBadge: {
    backgroundColor: "#3B82F615",
    borderColor: "#3B82F640",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  groupCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
    fontFamily: "monospace",
  },

  routesList: {
    backgroundColor: macOSColors.background.base,
  },

  groupDescription: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: macOSColors.background.input,
    borderLeftWidth: 3,
    borderLeftColor: macOSColors.semantic.info,
  },

  groupDescriptionText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    lineHeight: 16,
  },

  routeItem: {
    marginBottom: 6,
  },

  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  expandIndicator: {
    width: 20,
    alignItems: "center",
  },

  routeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  routePath: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },

  routeHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  childCountBadge: {
    backgroundColor: "#6B728015",
    borderColor: "#6B728040",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  childCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "monospace",
  },

  typeTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },

  typeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
  },

  routeDetails: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -6,
  },

  paramsContainer: {
    gap: 6,
  },

  paramsLabel: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginBottom: 4,
  },

  paramsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  paramTag: {
    backgroundColor: "#F59E0B15",
    borderColor: "#F59E0B40",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  paramText: {
    fontSize: 10,
    color: "#F59E0B",
    fontFamily: "monospace",
    fontWeight: "600",
  },

  routeButtons: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: macOSColors.background.input,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },

  actionButtonText: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    fontWeight: "600",
  },

  navigateButton: {
    backgroundColor: "#3B82F615",
    borderColor: "#3B82F640",
  },

  navigateButtonText: {
    fontSize: 12,
    color: "#3B82F6",
    fontFamily: "monospace",
    fontWeight: "600",
  },

  childrenContainer: {
    borderLeftWidth: 2,
    borderLeftColor: macOSColors.border.default,
    marginLeft: 16,
  },
});
