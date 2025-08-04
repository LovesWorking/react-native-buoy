import { View, StyleSheet } from "react-native";
import QueryStatus from "./QueryStatus";
import { useMutationStatusCounts } from "../../hooks/useQueryStatusCounts";
import { useRef, useState } from "react";
import { GestureResponderEvent, ScrollView } from "react-native";

interface MutationStatusCountProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

const MutationStatusCount: React.FC<MutationStatusCountProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { pending, success, error, paused } = useMutationStatusCounts();

  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleFilterClick = (filter: string, event?: GestureResponderEvent) => {
    if (event) {
      const dx = Math.abs(event.nativeEvent.pageX - touchStartX.current);
      const dy = Math.abs(event.nativeEvent.pageY - touchStartY.current);

      if (dx > 5 || dy > 5 || isScrolling) {
        return;
      }
    }

    if (onFilterChange) {
      onFilterChange(activeFilter === filter ? null : filter);
    }
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    touchStartX.current = event.nativeEvent.pageX;
    touchStartY.current = event.nativeEvent.pageY;
  };

  return (
    <View style={styles.mutationStatusContainer}>
      <ScrollView
        sentry-label="ignore devtools mutation status count scroll"
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
          label="Pending"
          color="blue"
          count={pending}
          isActive={activeFilter === "pending"}
          onPress={(event) => handleFilterClick("pending", event)}
          onTouchStart={handleTouchStart}
          showLabel={true}
        />
        <QueryStatus
          label="Success"
          color="green"
          count={success}
          isActive={activeFilter === "success"}
          onPress={(event) => handleFilterClick("success", event)}
          onTouchStart={handleTouchStart}
          showLabel={true}
        />
        <QueryStatus
          label="Error"
          color="red"
          count={error}
          isActive={activeFilter === "error"}
          onPress={(event) => handleFilterClick("error", event)}
          onTouchStart={handleTouchStart}
          showLabel={true}
        />
        <QueryStatus
          label="Paused"
          color="purple"
          count={paused}
          isActive={activeFilter === "paused"}
          onPress={(event) => handleFilterClick("paused", event)}
          onTouchStart={handleTouchStart}
          showLabel={true}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mutationStatusContainer: {
    flex: 1,
    minWidth: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    flexGrow: 1,
  },
});

export default MutationStatusCount;
