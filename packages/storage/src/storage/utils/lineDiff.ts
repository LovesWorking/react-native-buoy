/**
 * Line-by-line diff computation for React Native
 * Adapted from react-diff-viewer for object comparison
 */

export enum DiffType {
  DEFAULT = "unchanged",
  ADDED = "added",
  REMOVED = "removed",
  MODIFIED = "modified",
}

export interface WordDiff {
  value: string;
  type: DiffType;
}

export interface LineDiffInfo {
  leftLineNumber?: number;
  rightLineNumber?: number;
  type: DiffType;
  leftContent?: string | WordDiff[];
  rightContent?: string | WordDiff[];
  leftRaw?: string;
  rightRaw?: string;
}

/**
 * Compute diff based on method - for word-level diff within lines
 */
function computeDiffByMethod(
  oldStr: string,
  newStr: string,
  method: "chars" | "words" | "lines" | "trimmedLines",
): { left: WordDiff[]; right: WordDiff[] } {
  let oldParts: string[];
  let newParts: string[];

  switch (method) {
    case "chars":
      // Split into individual characters
      oldParts = oldStr.split("");
      newParts = newStr.split("");
      break;
    case "words":
      // Split by word boundaries, keeping whitespace
      oldParts = oldStr.match(/\S+|\s+/g) || [];
      newParts = newStr.match(/\S+|\s+/g) || [];
      break;
    case "trimmedLines":
      // For trimmedLines, compare without leading/trailing whitespace
      const oldTrimmed = oldStr.trim();
      const newTrimmed = newStr.trim();
      // But still do word-level diff on the trimmed content
      oldParts = oldTrimmed.match(/\S+|\s+/g) || [];
      newParts = newTrimmed.match(/\S+|\s+/g) || [];
      break;
    case "lines":
    default:
      // For lines mode, don't do word diff - just show the whole line
      return {
        left: [{ value: oldStr, type: DiffType.REMOVED }],
        right: [{ value: newStr, type: DiffType.ADDED }],
      };
  }

  // Simple LCS-like algorithm for better diff
  const left: WordDiff[] = [];
  const right: WordDiff[] = [];

  let i = 0,
    j = 0;

  // Find matching parts
  while (i < oldParts.length && j < newParts.length) {
    if (oldParts[i] === newParts[j]) {
      // Parts match
      left.push({ value: oldParts[i], type: DiffType.DEFAULT });
      right.push({ value: newParts[j], type: DiffType.DEFAULT });
      i++;
      j++;
    } else {
      // Look ahead for matches
      let foundMatch = false;

      // Check if we can find newParts[j] in upcoming oldParts
      for (let k = i + 1; k < Math.min(i + 5, oldParts.length); k++) {
        if (oldParts[k] === newParts[j]) {
          // Mark everything from i to k-1 as removed
          for (let m = i; m < k; m++) {
            left.push({ value: oldParts[m], type: DiffType.REMOVED });
          }
          i = k;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Check if we can find oldParts[i] in upcoming newParts
        for (let k = j + 1; k < Math.min(j + 5, newParts.length); k++) {
          if (newParts[k] === oldParts[i]) {
            // Mark everything from j to k-1 as added
            for (let m = j; m < k; m++) {
              right.push({ value: newParts[m], type: DiffType.ADDED });
            }
            j = k;
            foundMatch = true;
            break;
          }
        }
      }

      if (!foundMatch) {
        // No match found nearby, mark as changed
        left.push({ value: oldParts[i], type: DiffType.REMOVED });
        right.push({ value: newParts[j], type: DiffType.ADDED });
        i++;
        j++;
      }
    }
  }

  // Handle remaining parts
  while (i < oldParts.length) {
    left.push({ value: oldParts[i], type: DiffType.REMOVED });
    i++;
  }

  while (j < newParts.length) {
    right.push({ value: newParts[j], type: DiffType.ADDED });
    j++;
  }

  return { left, right };
}

/**
 * Convert object to formatted JSON lines
 */
function objectToLines(obj: unknown): string[] {
  if (obj === null || obj === undefined) {
    return [String(obj)];
  }

  try {
    // Pretty print JSON with 2 space indentation
    const jsonStr = JSON.stringify(obj, null, 2);
    // Split into lines and filter out empty lines that appear between array elements
    const lines = jsonStr.split("\n");

    // Remove empty lines but keep structure
    const filteredLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Keep the line if it's not empty or if it's meaningful whitespace
      if (trimmed !== "") {
        filteredLines.push(line);
      } else if (i === 0 || i === lines.length - 1) {
        // Keep first and last empty lines if they exist (though they shouldn't)
        filteredLines.push(line);
      }
      // Skip other empty lines
    }

    return filteredLines;
  } catch {
    return [String(obj)];
  }
}

export interface DiffComputeOptions {
  compareMethod?: "chars" | "words" | "lines" | "trimmedLines";
  disableWordDiff?: boolean;
  showDiffOnly?: boolean;
  contextLines?: number;
}

/**
 * Apply showDiffOnly filter with context lines
 */
function filterDiffWithContext(
  diffs: LineDiffInfo[],
  contextLines: number,
): LineDiffInfo[] {
  if (contextLines < 0) return diffs;

  const result: LineDiffInfo[] = [];
  const changedIndices: number[] = [];

  // Find all changed lines
  diffs.forEach((diff, idx) => {
    if (diff.type !== DiffType.DEFAULT) {
      changedIndices.push(idx);
    }
  });

  // If no changes, return empty
  if (changedIndices.length === 0) {
    return [];
  }

  // Build ranges to include
  const ranges: [number, number][] = [];
  let currentStart = Math.max(0, changedIndices[0] - contextLines);
  let currentEnd = Math.min(diffs.length - 1, changedIndices[0] + contextLines);

  for (let i = 1; i < changedIndices.length; i++) {
    const idx = changedIndices[i];
    const rangeStart = Math.max(0, idx - contextLines);
    const rangeEnd = Math.min(diffs.length - 1, idx + contextLines);

    // If ranges overlap or are adjacent, merge them
    if (rangeStart <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, rangeEnd);
    } else {
      // Save current range and start a new one
      ranges.push([currentStart, currentEnd]);
      currentStart = rangeStart;
      currentEnd = rangeEnd;
    }
  }

  // Don't forget the last range
  ranges.push([currentStart, currentEnd]);

  // Build result from ranges
  ranges.forEach(([start, end]) => {
    for (let i = start; i <= end; i++) {
      result.push(diffs[i]);
    }
  });

  return result;
}

/**
 * Compare lines based on method
 */
function compareLinesWithMethod(
  line1: string,
  line2: string,
  method: "chars" | "words" | "lines" | "trimmedLines",
): boolean {
  switch (method) {
    case "trimmedLines":
      return line1.trim() === line2.trim();
    case "chars":
    case "words":
    case "lines":
    default:
      return line1 === line2;
  }
}

/**
 * Compute line-by-line diff between two objects
 */
export function computeLineDiff(
  oldValue: unknown,
  newValue: unknown,
  options: DiffComputeOptions = {},
): LineDiffInfo[] {
  const {
    compareMethod = "words",
    disableWordDiff = false,
    showDiffOnly = false,
    contextLines = 3,
  } = options;
  const oldLines = objectToLines(oldValue);
  const newLines = objectToLines(newValue);

  const result: LineDiffInfo[] = [];
  let leftLineNum = 1;
  let rightLineNum = 1;

  // Simple line diff algorithm (can be improved with LCS)
  let i = 0,
    j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Rest are additions
      result.push({
        rightLineNumber: rightLineNum++,
        type: DiffType.ADDED,
        rightContent: newLines[j],
        rightRaw: newLines[j],
      });
      j++;
    } else if (j >= newLines.length) {
      // Rest are removals
      result.push({
        leftLineNumber: leftLineNum++,
        type: DiffType.REMOVED,
        leftContent: oldLines[i],
        leftRaw: oldLines[i],
      });
      i++;
    } else if (
      compareLinesWithMethod(
        oldLines[i],
        newLines[j],
        compareMethod === "trimmedLines" ? "trimmedLines" : "lines",
      )
    ) {
      // Lines match (possibly after trimming if trimmedLines)
      result.push({
        leftLineNumber: leftLineNum++,
        rightLineNumber: rightLineNum++,
        type: DiffType.DEFAULT,
        leftContent: oldLines[i],
        rightContent: newLines[j],
        leftRaw: oldLines[i],
        rightRaw: newLines[j],
      });
      i++;
      j++;
    } else {
      // Lines differ - check if it's a modification or separate add/remove
      const oldTrimmed = oldLines[i].trim();
      const newTrimmed = newLines[j].trim();

      // Simple heuristic: if lines start similarly, treat as modification
      if (
        oldTrimmed &&
        newTrimmed &&
        (oldTrimmed.startsWith(newTrimmed.substring(0, 3)) ||
          newTrimmed.startsWith(oldTrimmed.substring(0, 3)))
      ) {
        // Treat as modification - compute word diff if enabled
        if (!disableWordDiff && compareMethod !== "lines") {
          const wordDiff = computeDiffByMethod(
            oldLines[i],
            newLines[j],
            compareMethod,
          );
          result.push({
            leftLineNumber: leftLineNum++,
            rightLineNumber: rightLineNum++,
            type: DiffType.MODIFIED,
            leftContent: wordDiff.left,
            rightContent: wordDiff.right,
            leftRaw: oldLines[i],
            rightRaw: newLines[j],
          });
        } else {
          // No word diff - just mark lines as different
          result.push({
            leftLineNumber: leftLineNum++,
            rightLineNumber: rightLineNum++,
            type: DiffType.MODIFIED,
            leftContent: oldLines[i],
            rightContent: newLines[j],
            leftRaw: oldLines[i],
            rightRaw: newLines[j],
          });
        }
        i++;
        j++;
      } else {
        // Treat as separate remove and add
        result.push({
          leftLineNumber: leftLineNum++,
          type: DiffType.REMOVED,
          leftContent: oldLines[i],
          leftRaw: oldLines[i],
        });
        result.push({
          rightLineNumber: rightLineNum++,
          type: DiffType.ADDED,
          rightContent: newLines[j],
          rightRaw: newLines[j],
        });
        i++;
        j++;
      }
    }
  }

  // Apply showDiffOnly filter if enabled
  if (showDiffOnly) {
    return filterDiffWithContext(result, contextLines);
  }

  return result;
}

/**
 * Get background color for diff type
 */
export function getDiffBackgroundColor(
  type: DiffType,
  isDark: boolean = true,
): string {
  switch (type) {
    case DiffType.ADDED:
      return isDark ? "#044B5315" : "#e6ffed";
    case DiffType.REMOVED:
      return isDark ? "#632F3415" : "#ffeef0";
    case DiffType.MODIFIED:
      return isDark ? "#5a4a0015" : "#fff5dd";
    default:
      return "transparent";
  }
}

/**
 * Get text color for diff type
 */
export function getDiffTextColor(
  type: DiffType,
  isDark: boolean = true,
): string {
  switch (type) {
    case DiffType.ADDED:
      return isDark ? "#4ade80" : "#22863a";
    case DiffType.REMOVED:
      return isDark ? "#f87171" : "#cb2431";
    case DiffType.MODIFIED:
      return isDark ? "#facc15" : "#b08800";
    default:
      return isDark ? "#e5e7eb" : "#24292e";
  }
}

/**
 * Get word highlight color
 */
export function getWordHighlightColor(
  type: DiffType,
  isDark: boolean = true,
): string {
  switch (type) {
    case DiffType.ADDED:
      return isDark ? "#044B5340" : "#acf2bd";
    case DiffType.REMOVED:
      return isDark ? "#632F3440" : "#fdb8c0";
    default:
      return "transparent";
  }
}
