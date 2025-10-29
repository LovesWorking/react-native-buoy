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
} from "@react-buoy/shared-ui";
import { useRouteSitemap } from "../useRouteSitemap";
import type { RouteInfo, RouteGroup } from "../RouteParser";

// ============================================================================
// Types
// ============================================================================

interface RoutesSitemapProps {
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

  const router = useRouter();

  const { groups, stats, isLoaded, filteredRoutes } = useRouteSitemap({
    searchQuery,
    sortBy: "path",
  });

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
      {/* Compact header with stats and search button */}
      {!isSearching ? (
        <View style={styles.header}>
          <View style={styles.statsRow}>
            <StatItem value={stats.total} label="Total" />
            <StatItem value={stats.static} label="Static" />
            <StatItem value={stats.dynamic} label="Dynamic" />
            <StatItem value={stats.layouts} label="Layouts" />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setIsSearching(true)}
          >
            <Search size={16} color={macOSColors.text.secondary} />
          </TouchableOpacity>
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

        {/* Action buttons */}
        <View style={styles.routeHeaderActions}>
          <InlineCopyButton
            value={route.path}
            buttonStyle={styles.compactButton}
          />

          {canNavigate && (
            <TouchableOpacity
              style={[styles.compactButton, styles.compactNavigateButton]}
              onPress={() => onNavigate(route)}
            >
              <Text style={styles.compactButtonText}>Go</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.typeTag, { backgroundColor: typeColor }]}>
            <Text style={styles.typeText}>{route.type.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Expanded details - only show if there are params or children */}
      {isExpanded && (hasParams || hasChildren) && (
        <View style={styles.routeDetails}>
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
      return macOSColors.semantic.info; // Blue
    case "dynamic":
      return "#F59E0B"; // Vibrant Orange
    case "catch-all":
      return "#EC4899"; // Pink
    case "index":
      return macOSColors.semantic.success; // Green
    case "layout":
      return "#8B5CF6"; // Purple
    case "group":
      return "#6366F1"; // Indigo
    case "not-found":
      return macOSColors.semantic.error; // Red
    default:
      return macOSColors.text.secondary;
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
  },

  statItem: {
    alignItems: "center",
    backgroundColor: macOSColors.background.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 50,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
  },

  statLabel: {
    fontSize: 8,
    color: macOSColors.text.muted,
    marginTop: 2,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  searchButton: {
    padding: 6,
    borderRadius: 4,
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
    backgroundColor: macOSColors.semantic.info,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  groupCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "monospace",
  },

  routesList: {
    backgroundColor: macOSColors.background.base,
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

  compactButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: macOSColors.background.input,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },

  compactNavigateButton: {
    backgroundColor: "transparent",
    borderColor: macOSColors.border.default,
    paddingHorizontal: 8,
  },

  compactButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },

  typeTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  typeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
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
    backgroundColor: "#F59E0B",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  paramText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: "monospace",
    fontWeight: "700",
  },

  routeButtons: {
    flexDirection: "row",
    gap: 8,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },

  actionButtonText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    fontWeight: "600",
  },

  navigateButton: {
    backgroundColor: macOSColors.semantic.info,
    borderColor: macOSColors.semantic.info,
  },

  navigateButtonText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontFamily: "monospace",
    fontWeight: "600",
  },

  childrenContainer: {
    borderLeftWidth: 2,
    borderLeftColor: macOSColors.border.default,
    marginLeft: 16,
  },
});
