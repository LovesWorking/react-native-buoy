import { memo, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { gameUIColors } from "../ui/gameUI";

interface IndentGuideProps {
  depth: number;
  isLastChild: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  parentHasMoreSiblings?: boolean[];
  activeDepth?: number;
  itemHeight: number;
}

const INDENT_WIDTH = 10; // Width per indent level
const LINE_COLOR = gameUIColors.primary + "40"; // More visible line color (25% opacity)
const ACTIVE_LINE_COLOR = gameUIColors.primary + "66"; // Highlighted line color (40% opacity)

/**
 * IndentGuides component that renders VS Code-style indent guide lines
 * Shows vertical lines for each indent level and horizontal connectors
 */
export const IndentGuides = memo<IndentGuideProps>(
  ({
    depth,
    isLastChild,
    isExpanded,
    hasChildren,
    parentHasMoreSiblings = [],
    activeDepth = -1,
    itemHeight,
  }) => {
    const guides = useMemo(() => {
      const elements = [];

      // Render vertical guides for parent levels that continue through this item
      for (let level = 1; level < depth; level++) {
        const isActive = level === activeDepth;
        // Show line if parent at this level has more siblings
        const shouldShowLine = parentHasMoreSiblings[level - 1];

        if (shouldShowLine) {
          // Vertical line that passes through this item from parent levels
          elements.push(
            <View
              key={`v-${level}`}
              style={[
                styles.verticalLine,
                {
                  left: (level - 1) * INDENT_WIDTH - 0.5,
                  backgroundColor: isActive ? ACTIVE_LINE_COLOR : LINE_COLOR,
                  height: itemHeight,
                },
              ]}
            />
          );
        }
      }

      // Vertical line for the current item's level
      if (depth > 0) {
        // For last child without expansion, line goes to the middle
        // For expanded items or items with siblings below, line goes through entire height
        const lineHeight =
          isLastChild && !isExpanded ? itemHeight / 2 - 1 : itemHeight;

        elements.push(
          <View
            key={`v-current`}
            style={[
              styles.verticalLine,
              {
                left: (depth - 1) * INDENT_WIDTH - 0.5,
                backgroundColor:
                  activeDepth === depth - 1 ? ACTIVE_LINE_COLOR : LINE_COLOR,
                height: lineHeight,
              },
            ]}
          />
        );

        // Add a subtle L-shaped corner for last children that aren't expanded
        if (isLastChild && !isExpanded) {
          elements.push(
            <View
              key="h-corner"
              style={[
                styles.horizontalLine,
                {
                  left: (depth - 1) * INDENT_WIDTH,
                  top: itemHeight / 2 - 1,
                  width: INDENT_WIDTH / 2,
                  backgroundColor:
                    activeDepth === depth - 1 ? ACTIVE_LINE_COLOR : LINE_COLOR,
                },
              ]}
            />
          );
        }

        // For expanded items, add a small horizontal connector
        if (isExpanded && hasChildren) {
          elements.push(
            <View
              key="h-expand-connector"
              style={[
                styles.horizontalLine,
                {
                  left: (depth - 1) * INDENT_WIDTH,
                  top: itemHeight / 2 - 1,
                  width: INDENT_WIDTH / 2,
                  backgroundColor:
                    activeDepth === depth - 1 ? ACTIVE_LINE_COLOR : LINE_COLOR,
                },
              ]}
            />
          );
        }
      }

      // Vertical line extending down for expanded items with children
      if (hasChildren && isExpanded) {
        elements.push(
          <View
            key="v-children"
            style={[
              styles.verticalLine,
              {
                left: depth * INDENT_WIDTH - 0.5,
                top: itemHeight / 2,
                height: itemHeight / 2 + 1, // Extend slightly to connect better
                backgroundColor:
                  activeDepth === depth ? ACTIVE_LINE_COLOR : LINE_COLOR,
              },
            ]}
          />
        );
      }

      return elements;
    }, [
      depth,
      isLastChild,
      isExpanded,
      hasChildren,
      parentHasMoreSiblings,
      activeDepth,
      itemHeight,
    ]);

    if (depth === 0) {
      return null;
    }

    return (
      <View style={styles.container} pointerEvents="none">
        {guides}
      </View>
    );
  }
);

IndentGuides.displayName = "IndentGuides";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  verticalLine: {
    position: "absolute",
    width: 1.5, // Slightly thicker for better visibility
    top: 0,
  },
  horizontalLine: {
    position: "absolute",
    height: 1.5, // Slightly thicker for better visibility
  },
});
