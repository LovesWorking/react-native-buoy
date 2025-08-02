import { useState, useRef } from 'react';
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
import { QueryBrowser } from "./index";
import QueryInformation from "./QueryInformation";

interface Props {
  selectedQuery: Query<any, any, any, any> | undefined;
  setSelectedQuery: React.Dispatch<
    React.SetStateAction<Query<any, any, any, any> | undefined>
  >;
  activeFilter?: string | null;
  containerHeight?: number; // Optional prop for modal environments
}

export default function QueriesList({
  selectedQuery,
  setSelectedQuery,
  activeFilter,
  containerHeight,
}: Props) {
  // Height management for resizable query information panel
  const screenHeight = containerHeight || Dimensions.get("window").height;
  const defaultInfoHeight = screenHeight * 0.4; // 40% of available height
  const minInfoHeight = 150;
  const maxInfoHeight = screenHeight * 0.7; // 70% of available height

  const infoHeightAnim = useRef(new Animated.Value(defaultInfoHeight)).current;
  const [currentInfoHeight, setCurrentInfoHeight] = useState(defaultInfoHeight);
  const currentInfoHeightRef = useRef(defaultInfoHeight);

  // Pan responder for dragging the query information panel
  const infoPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 10
        );
      },
      onPanResponderTerminationRequest: () => false,
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

  // Simple wrapper for setSelectedQuery to match QueryBrowser interface
  const handleQuerySelect = (query: Query<any, any, any, any> | undefined) => {
    setSelectedQuery(query);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <QueryBrowser
          selectedQuery={selectedQuery}
          onQuerySelect={handleQuerySelect}
          activeFilter={activeFilter}
          contentContainerStyle={styles.listContent}
        />
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
