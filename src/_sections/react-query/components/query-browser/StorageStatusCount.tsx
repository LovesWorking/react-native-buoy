import { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  GestureResponderEvent,
} from "react-native";
import QueryStatus from "./QueryStatus";
import {
  StorageType,
  getStorageTypeLabel,
  getStorageTypeColor,
} from "../../utils/storageQueryUtils";
import { StorageTypeCounts } from "../../utils/getStorageQueryCounts";

interface StorageStatusCountProps {
  activeStorageTypes?: Set<StorageType>;
  onStorageTypesChange?: (storageTypes: Set<StorageType>) => void;
  counts?: StorageTypeCounts; // Optional counts to display
}

const allStorageTypes: StorageType[] = ["mmkv", "async", "secure"];

/**
 * Storage type filter component following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Dedicated component for storage type filtering
 * - No unnecessary memoization - simple toggle state management [[memory:4875074]]
 */
const StorageStatusCount: React.FC<StorageStatusCountProps> = ({
  activeStorageTypes = new Set(allStorageTypes),
  onStorageTypesChange,
  counts,
}) => {
  // Scroll state management like QueryStatusCount
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleStorageTypeToggle = (
    storageType: StorageType,
    event?: GestureResponderEvent
  ) => {
    if (event) {
      // Calculate distance moved during touch (like QueryStatusCount)
      const dx = Math.abs(event.nativeEvent.pageX - touchStartX.current);
      const dy = Math.abs(event.nativeEvent.pageY - touchStartY.current);

      // If touch moved more than 5px in any direction, it's a swipe, not a tap
      if (dx > 5 || dy > 5 || isScrolling) {
        return; // Don't trigger filter change
      }
    }

    if (onStorageTypesChange) {
      const newStorageTypes = new Set(activeStorageTypes);
      if (newStorageTypes.has(storageType)) {
        newStorageTypes.delete(storageType);
      } else {
        newStorageTypes.add(storageType);
      }
      onStorageTypesChange(newStorageTypes);
    }
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    touchStartX.current = event.nativeEvent.pageX;
    touchStartY.current = event.nativeEvent.pageY;
  };

  return (
    <View style={styles.storageStatusContainer}>
      <ScrollView
        sentry-label="ignore devtools storage status count scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setTimeout(() => setIsScrolling(false), 300)}
        onMomentumScrollBegin={() => setIsScrolling(true)}
        onMomentumScrollEnd={() => setTimeout(() => setIsScrolling(false), 300)}
      >
        {allStorageTypes.map((storageType) => {
          const count = counts?.[storageType] ?? 0;
          return (
            <QueryStatus
              key={storageType}
              label={getStorageTypeLabel(storageType)}
              color={getStorageTypeColor(storageType)}
              count={count} // Show actual storage query counts
              isActive={activeStorageTypes.has(storageType)}
              onPress={(event) => handleStorageTypeToggle(storageType, event)}
              onTouchStart={handleTouchStart}
              showLabel={true}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  storageStatusContainer: {
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

export default StorageStatusCount;
