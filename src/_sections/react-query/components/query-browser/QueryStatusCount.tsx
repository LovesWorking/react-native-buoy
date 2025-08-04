import { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  GestureResponderEvent,
} from "react-native";
import QueryStatus from "./QueryStatus";
import useQueryStatusCounts from "../../hooks/useQueryStatusCounts";

interface QueryStatusCountProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

const QueryStatusCount: React.FC<QueryStatusCountProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { fresh, stale, fetching, paused, inactive } = useQueryStatusCounts();

  // Scroll state management like ChipTabs
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleFilterClick = (filter: string, event?: GestureResponderEvent) => {
    if (event) {
      // Calculate distance moved during touch (like ChipTabs)
      const dx = Math.abs(event.nativeEvent.pageX - touchStartX.current);
      const dy = Math.abs(event.nativeEvent.pageY - touchStartY.current);

      // If touch moved more than 5px in any direction, it's a swipe, not a tap
      if (dx > 5 || dy > 5 || isScrolling) {
        return; // Don't trigger filter change
      }
    }

    if (onFilterChange) {
      // Toggle filter: if already active, clear it; otherwise set it
      onFilterChange(activeFilter === filter ? null : filter);
    }
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    touchStartX.current = event.nativeEvent.pageX;
    touchStartY.current = event.nativeEvent.pageY;
  };

  return (
    <View style={styles.queryStatusContainer}>
      <ScrollView
        sentry-label="ignore devtools query status count scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setTimeout(() => setIsScrolling(false), 300)}
        onMomentumScrollBegin={() => setIsScrolling(true)}
        onMomentumScrollEnd={() => setTimeout(() => setIsScrolling(false), 300)}
      >
        <QueryStatus
          label="Fresh"
          color="green"
          count={fresh}
          isActive={activeFilter === "fresh"}
          onPress={(event) => handleFilterClick("fresh", event)}
          onTouchStart={handleTouchStart}
          showLabel={true} // Always show labels now
        />
        <QueryStatus
          label="Loading"
          color="blue"
          count={fetching}
          isActive={activeFilter === "fetching"}
          onPress={(event) => handleFilterClick("fetching", event)}
          onTouchStart={handleTouchStart}
          showLabel={true} // Always show labels now
        />
        <QueryStatus
          label="Paused"
          color="purple"
          count={paused}
          isActive={activeFilter === "paused"}
          onPress={(event) => handleFilterClick("paused", event)}
          onTouchStart={handleTouchStart}
          showLabel={true} // Always show labels now
        />
        <QueryStatus
          label="Stale"
          color="yellow"
          count={stale}
          isActive={activeFilter === "stale"}
          onPress={(event) => handleFilterClick("stale", event)}
          onTouchStart={handleTouchStart}
          showLabel={true} // Always show labels now
        />
        <QueryStatus
          label="Idle"
          color="gray"
          count={inactive}
          isActive={activeFilter === "inactive"}
          onPress={(event) => handleFilterClick("inactive", event)}
          onTouchStart={handleTouchStart}
          showLabel={true} // Always show labels now
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  queryStatusContainer: {
    // Container for ScrollView - take full width
    flex: 1,
    minWidth: 0,
  },
  scrollView: {
    // ScrollView itself styles
    flex: 1,
  },
  scrollContent: {
    // ScrollView content styles
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Spacing between chips
    paddingHorizontal: 4, // Small padding on ends
    paddingVertical: 4,
    flexGrow: 1, // Allow content to grow to fill available space
  },
});

export default QueryStatusCount;
