import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";

interface FilterStatusBadgeProps {
  totalCount: number;
  filteredCount: number;
  onPress?: () => void;
}

/**
 * Compact badge showing filter status (e.g., "Showing 5 of 12")
 * Displayed below the header when filters are active
 */
export function FilterStatusBadge({
  totalCount,
  filteredCount,
  onPress,
}: FilterStatusBadgeProps) {
  // Don't show if no filtering is happening
  if (filteredCount === totalCount) {
    return null;
  }

  const content = (
    <View style={styles.container}>
      <Text style={styles.text}>
        Showing {filteredCount} of {totalCount}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  text: {
    fontSize: 9,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
});
