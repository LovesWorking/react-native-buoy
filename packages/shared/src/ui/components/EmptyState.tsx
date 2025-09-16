import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from "react-native";
import { LucideIcon } from "rn-better-dev-tools/icons";

interface EmptyStateProps {
  /** Primary message to display */
  title: string;
  /** Optional secondary/description message */
  description?: string;
  /** Optional icon to display above the text */
  icon?: LucideIcon;
  /** Optional icon size (default: 48) */
  iconSize?: number;
  /** Optional icon color */
  iconColor?: string;
  /** Optional action button */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Optional style variant */
  variant?: "default" | "minimal" | "card";
  /** Optional custom styles */
  style?: ViewStyle;
}

/**
 * Reusable empty state component for consistent empty/no-data displays
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  iconSize = 48,
  iconColor = "#4B5563",
  action,
  variant = "default",
  style,
}: EmptyStateProps) {
  const containerStyle = [
    styles.container,
    variant === "card" && styles.cardVariant,
    variant === "minimal" && styles.minimalVariant,
    style,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={iconSize} color={iconColor} />
          </View>
        )}

        <Text style={styles.title}>{title}</Text>

        {description && <Text style={styles.description}>{description}</Text>}

        {action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={action.onPress}
          >
            <Text style={styles.actionButtonText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Pre-configured empty state for no data scenarios
 */
export function NoDataEmptyState() {
  return (
    <EmptyState
      title="No data found"
      description="Data will appear here when available"
    />
  );
}

/**
 * Pre-configured empty state for filtered results
 */
export function NoResultsEmptyState() {
  return (
    <EmptyState
      title="No matching results"
      description="Try adjusting your filters to see more results"
    />
  );
}

/**
 * Pre-configured empty state for search results
 */
export function NoSearchResultsEmptyState({
  searchTerm,
}: {
  searchTerm?: string;
}) {
  return (
    <EmptyState
      title="No search results"
      description={
        searchTerm
          ? `No results found for "${searchTerm}"`
          : "Try a different search term"
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  cardVariant: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  minimalVariant: {
    padding: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: "#4B5563",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  actionButtonText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
  },
});
