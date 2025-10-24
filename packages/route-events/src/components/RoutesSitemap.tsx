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

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { macOSColors, Search, Copy, ChevronDown, ChevronRight, copyToClipboard } from '@react-buoy/shared-ui';
import { useRouteSitemap } from '../useRouteSitemap';
import type { RouteInfo, RouteGroup } from '../RouteParser';

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
  onCopyPath: (path: string) => void;
  onNavigate: (route: RouteInfo) => void;
}

interface RouteItemViewProps {
  route: RouteInfo;
  depth?: number;
  onCopyPath: (path: string) => void;
  onNavigate: (route: RouteInfo) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function RoutesSitemap({ style }: RoutesSitemapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Root Routes', 'Dynamic Routes'])
  );

  const router = useRouter();

  const { groups, stats, isLoaded, filteredRoutes } = useRouteSitemap({
    searchQuery,
    sortBy: 'path',
  });

  const handleToggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  }, []);

  const handleCopyPath = useCallback(async (path: string) => {
    const success = await copyToClipboard(path);
    if (success) {
      Alert.alert('Copied', `Path "${path}" copied to clipboard`);
    } else {
      Alert.alert('Error', 'Failed to copy path');
    }
  }, []);

  const promptForParams = useCallback((
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
        if (route.type === 'catch-all') {
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
        Alert.alert('Navigation Error', String(error));
      }
      return;
    }

    const currentParam = params[paramIndex];
    const paramDisplay = route.type === 'catch-all' ? `[...${currentParam}]` : `[${currentParam}]`;

    Alert.prompt(
      'Enter Parameter Value',
      `Enter value for ${paramDisplay}:\n\nRoute: ${route.path}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: paramIndex < params.length - 1 ? 'Next' : 'Navigate',
          onPress: (value?: string) => {
            if (value && value.trim()) {
              const newParams = {
                ...collectedParams,
                [currentParam]: value.trim(),
              };
              promptForParams(route, paramIndex + 1, newParams);
            } else {
              Alert.alert('Invalid Value', 'Please enter a value for the parameter');
            }
          },
        },
      ],
      'plain-text'
    );
  }, [router]);

  const handleNavigate = useCallback((route: RouteInfo) => {
    // Don't navigate to layouts or groups
    if (route.type === 'layout' || route.type === 'group') {
      Alert.alert(
        'Cannot Navigate',
        `${route.type === 'layout' ? 'Layouts' : 'Route groups'} are not navigable routes`
      );
      return;
    }

    // For dynamic routes, prompt for parameters
    if (route.type === 'dynamic' || route.type === 'catch-all') {
      if (route.params.length === 0) {
        // No parameters despite being dynamic? Just navigate
        try {
          router.push(route.path as any);
        } catch (error) {
          Alert.alert('Navigation Error', String(error));
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
      Alert.alert('Navigation Error', String(error));
    }
  }, [router, promptForParams]);

  // When searching, show filtered routes, otherwise show groups
  const displayGroups = useMemo(() => {
    if (searchQuery && filteredRoutes.length > 0) {
      // Create a single "Search Results" group
      return [
        {
          title: 'Search Results',
          icon: '',
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
      {/* Header with stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Routes Sitemap</Text>
        <View style={styles.statsRow}>
          <StatItem value={stats.total} label="Total" />
          <StatItem value={stats.static} label="Static" />
          <StatItem value={stats.dynamic} label="Dynamic" />
          <StatItem value={stats.layouts} label="Layouts" />
        </View>
      </View>

      {/* Search bar */}
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
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

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
          displayGroups.map(group => (
            <RouteGroupView
              key={group.title}
              group={group}
              isExpanded={
                searchQuery.length > 0 || expandedGroups.has(group.title)
              }
              onToggleExpand={() => handleToggleGroup(group.title)}
              onCopyPath={handleCopyPath}
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
  onCopyPath,
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
              onCopyPath={onCopyPath}
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
  onCopyPath,
  onNavigate,
}: RouteItemViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = route.children.length > 0;

  const typeColor = getRouteTypeColor(route.type);

  return (
    <View style={[styles.routeItem, { marginLeft: depth * 16 }]}>
      <TouchableOpacity
        style={styles.routeHeader}
        onPress={() => hasChildren && setIsExpanded(!isExpanded)}
        activeOpacity={hasChildren ? 0.7 : 1}
      >
        <View style={styles.routeHeaderLeft}>
          {hasChildren && (
            isExpanded ? (
              <ChevronDown size={12} color={macOSColors.text.muted} />
            ) : (
              <ChevronRight size={12} color={macOSColors.text.muted} />
            )
          )}
          <Text style={styles.routePath} numberOfLines={1}>
            {route.path}
          </Text>
        </View>
        <View style={styles.routeActions}>
          <View style={[styles.typeTag, { backgroundColor: typeColor }]}>
            <Text style={styles.typeText}>{route.type}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Route details */}
      <View style={styles.routeDetails}>
        {route.params.length > 0 && (
          <View style={styles.paramsContainer}>
            <Text style={styles.paramsLabel}>Params:</Text>
            {route.params.map(param => (
              <View key={param} style={styles.paramTag}>
                <Text style={styles.paramText}>{param}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.routeButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onCopyPath(route.path)}
          >
            <Copy size={12} color={macOSColors.text.secondary} />
            <Text style={styles.actionButtonText}>Copy</Text>
          </TouchableOpacity>

          {route.type !== 'layout' && route.type !== 'group' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.navigateButton]}
              onPress={() => onNavigate(route)}
            >
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Children routes */}
      {isExpanded && hasChildren && (
        <View style={styles.childrenContainer}>
          {route.children.map((child, index) => (
            <RouteItemView
              key={`${child.path}-${index}`}
              route={child}
              depth={depth + 1}
              onCopyPath={onCopyPath}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getRouteTypeColor(type: RouteInfo['type']): string {
  switch (type) {
    case 'static':
      return macOSColors.semantic.infoBackground;
    case 'dynamic':
      return macOSColors.semantic.warningBackground;
    case 'catch-all':
      return macOSColors.semantic.errorBackground;
    case 'index':
      return macOSColors.semantic.successBackground;
    case 'layout':
      return macOSColors.background.input;
    case 'group':
      return macOSColors.background.input;
    case 'not-found':
      return macOSColors.semantic.errorBackground;
    default:
      return macOSColors.background.input;
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: macOSColors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
  },

  statLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    marginTop: 2,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },

  searchInput: {
    flex: 1,
    color: macOSColors.text.primary,
    fontSize: 14,
    fontFamily: 'monospace',
  },

  clearButton: {
    color: macOSColors.text.muted,
    fontSize: 18,
    paddingHorizontal: 8,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingVertical: 8,
  },

  emptyState: {
    padding: 32,
    alignItems: 'center',
  },

  emptyText: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },

  groupContainer: {
    marginVertical: 4,
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: macOSColors.background.card,
  },

  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  groupBadge: {
    backgroundColor: macOSColors.background.input,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  groupCount: {
    fontSize: 11,
    fontWeight: '600',
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
  },

  routesList: {
    backgroundColor: macOSColors.background.base,
  },

  routeItem: {
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.input,
  },

  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
  },

  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  routePath: {
    fontSize: 13,
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
  },

  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },

  typeTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },

  routeDetails: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },

  paramsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  paramsLabel: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
  },

  paramTag: {
    backgroundColor: macOSColors.background.input,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  paramText: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
  },

  routeButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  actionButtonText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },

  navigateButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
  },

  navigateButtonText: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },

  childrenContainer: {
    borderLeftWidth: 2,
    borderLeftColor: macOSColors.border.default,
    marginLeft: 16,
  },
});
