/**
 * SplitDiffViewer
 *
 * A line-by-line split diff viewer for comparing two values.
 * Shows PREV on the left and CUR on the right with word-level highlighting.
 * This is a dumb component - all state is controlled externally.
 */

import React, { Fragment, useMemo, memo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import {
  computeLineDiff,
  DiffType,
  LineDiffInfo,
  WordDiff,
  DiffComputeOptions,
} from "./lineDiff";
import { DiffSummary } from "./DiffSummary";
import { DiffTheme, devToolsDefaultTheme } from "./diffThemes";

export interface SplitDiffViewerOptions {
  /** Hide line numbers */
  hideLineNumbers?: boolean;
  /** Disable word-level diff highlighting */
  disableWordDiff?: boolean;
  /** Only show changed lines with context */
  showDiffOnly?: boolean;
  /** Comparison method */
  compareMethod?: "chars" | "words" | "lines" | "trimmedLines";
  /** Number of context lines when showDiffOnly is true */
  contextLines?: number;
}

export interface SplitDiffViewerProps {
  /** Old (previous) value to compare */
  oldValue: unknown;
  /** New (current) value to compare */
  newValue: unknown;
  /** Theme for styling (defaults to devToolsDefault) */
  theme?: DiffTheme;
  /** Diff options */
  options?: SplitDiffViewerOptions;
  /** Show theme name badge */
  showThemeName?: boolean;
  /** Fixed height (defaults to 400) */
  height?: number;
}

/**
 * SplitDiffViewer displays a side-by-side diff comparison.
 */
export const SplitDiffViewer = memo(function SplitDiffViewer({
  oldValue,
  newValue,
  theme = devToolsDefaultTheme,
  options = {},
  showThemeName = false,
  height = 400,
}: SplitDiffViewerProps) {
  const {
    hideLineNumbers = false,
    disableWordDiff = false,
    showDiffOnly = false,
    compareMethod = "words",
    contextLines = 3,
  } = options;

  // Compute line-by-line diff with options
  const diffComputeOptions: DiffComputeOptions = {
    compareMethod,
    disableWordDiff,
    showDiffOnly,
    contextLines,
  };

  const lineDiffs = useMemo(
    () => computeLineDiff(oldValue, newValue, diffComputeOptions),
    [oldValue, newValue, compareMethod, disableWordDiff, showDiffOnly, contextLines]
  );

  // Create dynamic styles based on theme
  const dynamicStyles = useMemo(() => createDynamicStyles(theme, height), [theme, height]);

  // Render word diff content
  const renderWordDiff = (wordDiffs: WordDiff[]) => {
    return wordDiffs.map((word, idx) => {
      let backgroundColor = "transparent";
      if (word.type === DiffType.ADDED) {
        backgroundColor = theme.addedWordHighlight;
      } else if (word.type === DiffType.REMOVED) {
        backgroundColor = theme.removedWordHighlight;
      }

      return (
        <Text key={idx} style={[dynamicStyles.wordDiff, { backgroundColor }]}>
          {word.value}
        </Text>
      );
    });
  };

  // Get colors for diff type
  const getDiffColors = (type: DiffType, isModified: boolean = false) => {
    if (isModified) {
      return {
        background: theme.modifiedBackground,
        text: theme.modifiedText,
        markerBg: theme.markerModifiedBackground,
      };
    }

    switch (type) {
      case DiffType.ADDED:
        return {
          background: theme.addedBackground,
          text: theme.addedText,
          markerBg: theme.markerAddedBackground,
        };
      case DiffType.REMOVED:
        return {
          background: theme.removedBackground,
          text: theme.removedText,
          markerBg: theme.markerRemovedBackground,
        };
      case DiffType.DEFAULT:
        return {
          background: theme.unchangedBackground,
          text: theme.unchangedText,
          markerBg: "transparent",
        };
      default:
        return {
          background: theme.unchangedBackground,
          text: theme.unchangedText,
          markerBg: "transparent",
        };
    }
  };

  // Render a single line side (left or right)
  const renderLineSide = (
    lineNumber: number | undefined,
    content: string | WordDiff[] | undefined,
    type: DiffType,
    marker: string,
    isEmpty: boolean = false
  ) => {
    if (isEmpty) {
      return (
        <>
          {!hideLineNumbers && (
            <View style={[dynamicStyles.gutter, dynamicStyles.emptyGutter]}>
              <Text style={dynamicStyles.lineNumber}> </Text>
            </View>
          )}
          <View style={[dynamicStyles.marker, dynamicStyles.emptyMarker]}>
            <Text style={dynamicStyles.markerText}> </Text>
          </View>
          <View style={[dynamicStyles.contentCell, dynamicStyles.emptyContent]}>
            <Text style={dynamicStyles.content}> </Text>
          </View>
        </>
      );
    }

    const colors = getDiffColors(type);

    return (
      <>
        {/* Line number gutter */}
        {!hideLineNumbers && (
          <View
            style={[
              dynamicStyles.gutter,
              { backgroundColor: theme.lineNumberBackground },
            ]}
          >
            <Text style={dynamicStyles.lineNumber}>{lineNumber || " "}</Text>
          </View>
        )}

        {/* Change marker */}
        <View
          style={[dynamicStyles.marker, { backgroundColor: colors.markerBg }]}
        >
          <Text style={[dynamicStyles.markerText, { color: theme.markerText }]}>
            {marker}
          </Text>
        </View>

        {/* Content */}
        <View
          style={[
            dynamicStyles.contentCell,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[dynamicStyles.content, { color: colors.text }]}>
            {Array.isArray(content) ? renderWordDiff(content) : content || " "}
          </Text>
        </View>
      </>
    );
  };

  // Check if we should show a separator (gap in line numbers)
  const shouldShowSeparator = (idx: number, diffs: LineDiffInfo[]) => {
    if (!showDiffOnly || idx === 0) return false;

    const prevDiff = diffs[idx - 1];
    const currDiff = diffs[idx];

    // Check for gap in line numbers
    const leftGap =
      currDiff.leftLineNumber &&
      prevDiff.leftLineNumber &&
      currDiff.leftLineNumber - prevDiff.leftLineNumber > 1;
    const rightGap =
      currDiff.rightLineNumber &&
      prevDiff.rightLineNumber &&
      currDiff.rightLineNumber - prevDiff.rightLineNumber > 1;

    return leftGap || rightGap;
  };

  // Render a complete row with both left and right sides
  const renderDiffRow = (
    diff: LineDiffInfo,
    idx: number,
    diffs: LineDiffInfo[]
  ) => {
    const isRemoved = diff.type === DiffType.REMOVED;
    const isAdded = diff.type === DiffType.ADDED;
    const isModified = diff.type === DiffType.MODIFIED;
    const isDefault = diff.type === DiffType.DEFAULT;

    return (
      <Fragment key={idx}>
        {shouldShowSeparator(idx, diffs) && (
          <View style={dynamicStyles.separator}>
            <Text style={dynamicStyles.separatorText}>• • •</Text>
          </View>
        )}
        <View style={dynamicStyles.row}>
          {/* Left side (PREV) */}
          <View style={dynamicStyles.leftSide}>
            {isRemoved || isModified || isDefault
              ? renderLineSide(
                  diff.leftLineNumber,
                  diff.leftContent,
                  isModified ? DiffType.REMOVED : diff.type,
                  isRemoved || isModified ? "-" : " "
                )
              : renderLineSide(
                  undefined,
                  undefined,
                  DiffType.DEFAULT,
                  " ",
                  true
                )}
          </View>

          {/* Center divider */}
          <View style={dynamicStyles.centerDivider} />

          {/* Right side (CUR) */}
          <View style={dynamicStyles.rightSide}>
            {isAdded || isModified || isDefault
              ? renderLineSide(
                  diff.rightLineNumber,
                  diff.rightContent,
                  isModified ? DiffType.ADDED : diff.type,
                  isAdded || isModified ? "+" : " "
                )
              : renderLineSide(
                  undefined,
                  undefined,
                  DiffType.DEFAULT,
                  " ",
                  true
                )}
          </View>
        </View>
      </Fragment>
    );
  };

  // Count diff statistics
  const addedCount = lineDiffs.filter((d) => d.type === DiffType.ADDED).length;
  const removedCount = lineDiffs.filter((d) => d.type === DiffType.REMOVED).length;
  const modifiedCount = lineDiffs.filter((d) => d.type === DiffType.MODIFIED).length;

  return (
    <View
      style={[
        dynamicStyles.container,
        theme.glowColor && {
          shadowColor: theme.glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity:
            theme.neonIntensity && theme.neonIntensity > 0.7
              ? 0.5
              : theme.neonIntensity && theme.neonIntensity > 0.3
              ? 0.3
              : 0.1,
          shadowRadius:
            theme.neonIntensity && theme.neonIntensity > 0.7
              ? 10
              : theme.neonIntensity && theme.neonIntensity > 0.3
              ? 5
              : 2,
        },
      ]}
    >
      {showThemeName && (
        <View style={dynamicStyles.themeBadge}>
          <Text style={dynamicStyles.themeName}>{theme.name}</Text>
          <Text style={dynamicStyles.themeDescription}>{theme.description}</Text>
        </View>
      )}

      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <Text style={dynamicStyles.headerTitle}>PREV</Text>
        </View>
        <View style={dynamicStyles.divider} />
        <View style={dynamicStyles.headerRight}>
          <Text style={dynamicStyles.headerTitle}>CUR</Text>
        </View>
      </View>

      {/* Summary bar (top) */}
      <DiffSummary
        added={addedCount}
        removed={removedCount}
        modified={modifiedCount}
        theme={theme}
      />

      {/* Single ScrollView for both sides */}
      <ScrollView
        style={dynamicStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {lineDiffs.length === 0 ? (
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyText}>
              {showDiffOnly ? "No differences found" : "No content to display"}
            </Text>
          </View>
        ) : (
          lineDiffs.map((diff, idx) => renderDiffRow(diff, idx, lineDiffs))
        )}
      </ScrollView>
    </View>
  );
});

// Create dynamic styles based on theme
function createDynamicStyles(theme: DiffTheme, height: number) {
  return StyleSheet.create({
    container: {
      height,
      backgroundColor: theme.background,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    themeBadge: {
      backgroundColor: theme.panelBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    themeName: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.accentColor || theme.unchangedText,
      fontFamily: "monospace",
      letterSpacing: 0.5,
    },
    themeDescription: {
      fontSize: 10,
      color: theme.unchangedText,
      fontFamily: "monospace",
      marginTop: 2,
      opacity: 0.8,
    },
    header: {
      flexDirection: "row",
      backgroundColor: theme.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerLeft: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    headerRight: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    headerTitle: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.accentColor || theme.unchangedText,
      fontFamily: "monospace",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    divider: {
      width: 1,
      backgroundColor: theme.dividerColor,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 10,
    },
    row: {
      flexDirection: "row",
      minHeight: 20,
    },
    leftSide: {
      flex: 1,
      flexDirection: "row",
    },
    rightSide: {
      flex: 1,
      flexDirection: "row",
    },
    centerDivider: {
      width: 1,
      backgroundColor: theme.dividerColor,
    },
    gutter: {
      width: 35,
      paddingHorizontal: 4,
      justifyContent: "center",
      alignItems: "flex-end",
      backgroundColor: theme.lineNumberBackground,
      borderRightWidth: 1,
      borderRightColor: theme.lineNumberBorder,
    },
    emptyGutter: {
      backgroundColor: theme.contextBackground,
    },
    lineNumber: {
      fontSize: 9,
      fontFamily: "monospace",
      color: theme.lineNumberText,
    },
    marker: {
      width: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyMarker: {
      backgroundColor: theme.contextBackground,
    },
    markerText: {
      fontSize: 10,
      fontFamily: "monospace",
      fontWeight: "600",
    },
    contentCell: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    emptyContent: {
      backgroundColor: theme.contextBackground,
    },
    content: {
      fontSize: 10,
      fontFamily: "monospace",
      lineHeight: 16,
    },
    wordDiff: {
      fontSize: 10,
      fontFamily: "monospace",
    },
    separator: {
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.separatorBackground,
    },
    separatorText: {
      fontSize: 8,
      color: theme.separatorText,
      fontFamily: "monospace",
      letterSpacing: 2,
    },
    emptyState: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      fontSize: 11,
      color: theme.emptyStateText,
      fontStyle: "italic",
      fontFamily: "monospace",
    },
  });
}
