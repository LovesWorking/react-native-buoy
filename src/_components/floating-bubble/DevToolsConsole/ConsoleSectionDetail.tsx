import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ConsoleSectionDetailProps {
  children: React.ReactNode;
}

/**
 * Detail view component following render props pattern.
 * Provides layout and scrolling while delegating content rendering to children.
 */
export function ConsoleSectionDetail({ children }: ConsoleSectionDetailProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <ScrollView
        style={styles.detailScrollContainer}
        contentContainerStyle={styles.detailScrollContent}
      >
        {children}
      </ScrollView>
      {/* Safe area for detail view */}
      <View style={[styles.detailSafeArea, { height: insets.bottom }]} />
    </>
  );
}

const styles = StyleSheet.create({
  detailScrollContainer: {
    flex: 1,
  },

  detailScrollContent: {
    padding: 8,
    flexGrow: 1,
  },

  detailSafeArea: {
    backgroundColor: "#2A2A2A",
  },
});
