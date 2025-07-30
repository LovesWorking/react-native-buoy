import React, { useState, useRef } from "react";
import { Query } from "@tanstack/react-query";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  PanResponder,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import QueryRow from "./QueryRow";
import useAllQueries from "../_hooks/useAllQueries";
import QueryInformation from "./QueryInformation";
import { getQueryStatusLabel } from "../_util/getQueryStatusLabel";

interface Props {
  selectedQuery: Query<any, any, any, any> | undefined;
  setSelectedQuery: React.Dispatch<
    React.SetStateAction<Query<any, any, any, any> | undefined>
  >;
  activeFilter?: string | null;
}

export default function QueriesList({
  selectedQuery,
  setSelectedQuery,
  activeFilter,
}: Props) {
  // Holds all queries
  const allQueries = useAllQueries();

  // Filter queries based on active filter
  const filteredQueries = React.useMemo(() => {
    if (!activeFilter) {
      return allQueries;
    }

    return allQueries.filter((query) => {
      const status = getQueryStatusLabel(query);
      return status === activeFilter;
    });
  }, [allQueries, activeFilter]);

  // Height management for resizable query information panel
  const screenHeight = Dimensions.get("window").height;
  const defaultInfoHeight = screenHeight * 0.4; // 40% of screen height
  const minInfoHeight = 150;
  const maxInfoHeight = screenHeight * 0.7; // 70% of screen height

  const infoHeightAnim = useRef(new Animated.Value(defaultInfoHeight)).current;
  const [currentInfoHeight, setCurrentInfoHeight] = useState(defaultInfoHeight);
  const currentInfoHeightRef = useRef(defaultInfoHeight);

  // Pan responder for dragging the query information panel
  const infoPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 10
        );
      },
      onPanResponderGrant: () => {
        infoHeightAnim.stopAnimation((value) => {
          setCurrentInfoHeight(value);
          currentInfoHeightRef.current = value;
          infoHeightAnim.setValue(value);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Use the ref value which is always current
        const newHeight = currentInfoHeightRef.current - gestureState.dy;
        const clampedHeight = Math.max(
          minInfoHeight,
          Math.min(maxInfoHeight, newHeight)
        );
        infoHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const finalHeight = Math.max(
          minInfoHeight,
          Math.min(
            maxInfoHeight,
            currentInfoHeightRef.current - gestureState.dy
          )
        );
        setCurrentInfoHeight(finalHeight);
        currentInfoHeightRef.current = finalHeight;

        Animated.timing(infoHeightAnim, {
          toValue: finalHeight,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          // Ensure the animated value and state are perfectly synced after animation
          infoHeightAnim.setValue(finalHeight);
          setCurrentInfoHeight(finalHeight);
          currentInfoHeightRef.current = finalHeight;
        });
      },
    })
  ).current;

  // Function to handle query selection
  const handleQuerySelect = (query: Query<any, any, any, any>) => {
    // If deselecting (i.e., clicking the same query), just update the state
    if (query === selectedQuery) {
      setSelectedQuery(undefined);
      return;
    }
    setSelectedQuery(query); // Update the selected query
  };

  const renderItem = ({ item }: { item: Query<any, any, any, any> }) => (
    <QueryRow
      query={item}
      isSelected={selectedQuery === item}
      onSelect={handleQuerySelect}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        {filteredQueries.length > 0 ? (
          <FlashList
            data={filteredQueries}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              `${JSON.stringify(item.queryKey)}-${index}`
            }
            estimatedItemSize={60}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            removeClippedSubviews
            renderScrollComponent={ScrollView}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeFilter
                ? `No ${activeFilter} queries found`
                : "No queries found"}
            </Text>
          </View>
        )}
      </View>
      {selectedQuery && (
        <Animated.View
          style={[styles.queryInformation, { height: infoHeightAnim }]}
        >
          {/* Drag handle for resizing */}
          <View style={styles.dragHandle} {...infoPanResponder.panHandlers}>
            <View style={styles.dragIndicator} />
          </View>
          <View style={styles.queryInfoContent}>
            <QueryInformation
              selectedQuery={selectedQuery}
              setSelectedQuery={setSelectedQuery}
            />
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#171717",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  queryInformation: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#171717",
  },
  dragHandle: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
  queryInfoContent: {
    flex: 1,
    backgroundColor: "#171717",
  },
});
