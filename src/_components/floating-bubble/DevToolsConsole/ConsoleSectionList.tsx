import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ConsoleSectionListProps {
  children: React.ReactNode;
}

/**
 * Container component for console sections following composition principles.
 * Handles layout and scrolling while delegating section rendering to children.
 */
export function ConsoleSectionList({ children }: ConsoleSectionListProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <ScrollView
        sentry-label="ignore devtools console section list scroll"
        style={styles.sectionListContainer}
        contentContainerStyle={styles.sectionListContent}
      >
        {children}
      </ScrollView>
      {/* Safe area for section list */}
      <View style={[styles.sectionListSafeArea, { height: insets.bottom }]} />
    </>
  );
}

const styles = StyleSheet.create({
  sectionListContainer: {
    flex: 1,
  },

  sectionListContent: {
    paddingHorizontal: 12, // Match modal contentContainer padding
    paddingVertical: 8,
    flexGrow: 1,
  },

  sectionListSafeArea: {
    backgroundColor: "#2A2A2A",
  },
});
