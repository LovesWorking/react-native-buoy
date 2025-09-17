import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { gameUIColors } from '@/rn-better-dev-tools/src/shared/ui/gameUI/constants/gameUIColors';

interface GuideItem {
  depth: number;
  parentHasMoreSiblings?: boolean[];
}

interface VisibleRange {
  start: number;
  end: number;
}

interface IndentGuidesOverlayProps<T extends GuideItem = GuideItem> {
  items: T[];
  visibleRange: VisibleRange;
  itemHeight: number;
  indentWidth: number;
  activeDepth?: number; // optional: highlight this depth
}

const NORMAL_ALPHA = '4D'; // ~30%
const ACTIVE_ALPHA = '80'; // ~50%
export const IndentGuidesOverlay = memo(
  ({ items, visibleRange, itemHeight, indentWidth, activeDepth = -1 }: IndentGuidesOverlayProps) => {
    const columns = useMemo(() => {
      const start = Math.max(0, visibleRange.start);
      const end = Math.min(items.length - 1, visibleRange.end);
      if (start > end || items.length === 0) return [] as Array<{
        depth: number;
        left: number;
        segments: Array<{ startIndex: number; endIndex: number }>;
      }>;

      // Find max depth in visible range
      let maxDepth = 0;
      for (let i = start; i <= end; i++) {
        const d = items[i]?.depth ?? 0;
        if (d > maxDepth) maxDepth = d;
      }

      const results: Array<{
        depth: number;
        left: number;
        segments: Array<{ startIndex: number; endIndex: number }>;
      }> = [];

      for (let depth = 1; depth <= maxDepth; depth++) {
        const leftTarget = (depth - 0.5) * indentWidth; // center of indent column
        const left = Math.round(leftTarget) + 0.5; // snap for crisp 1px
        const segments: Array<{ startIndex: number; endIndex: number }> = [];

        let segStart = -1;
        let segEnd = -1;

        for (let i = start; i <= end; i++) {
          const item = items[i];
          // Draw a column for any row that reaches this depth
          // i.e. all rows with depth >= current column depth
          const showAtThisDepth = (item?.depth ?? 0) >= depth;

          if (showAtThisDepth) {
            if (segStart === -1) segStart = i;
            segEnd = i;
          } else if (segStart !== -1) {
            segments.push({ startIndex: segStart, endIndex: segEnd });
            segStart = -1;
            segEnd = -1;
          }
        }

        if (segStart !== -1) {
          segments.push({ startIndex: segStart, endIndex: segEnd });
        }

        if (segments.length > 0) {
          results.push({ depth, left, segments });
        }
      }

      return results;
    }, [items, visibleRange, itemHeight, indentWidth]);

    return (
      <View pointerEvents="none" style={styles.overlay}>
        {columns.map((col) =>
          col.segments.map((seg, idx) => {
            const top = (seg.startIndex - visibleRange.start) * itemHeight;
            const height = (seg.endIndex - seg.startIndex + 1) * itemHeight;
            const isActive = col.depth === activeDepth;
            return (
              <View
                key={`${col.depth}-${idx}`}
                style={[
                  styles.line,
                  {
                    left: col.left,
                    top,
                    height,
                    backgroundColor: `${gameUIColors.primary}${isActive ? ACTIVE_ALPHA : NORMAL_ALPHA}`,
                  },
                ]}
              />
            );
          })
        )}
      </View>
    );
  }
);

IndentGuidesOverlay.displayName = 'IndentGuidesOverlay';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    width: 1,
  },
});
