/**
 * Utility functions for computing diffs between values
 */

export interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Simple word-level diff for strings
 */
export function computeStringDiff(
  oldStr: string,
  newStr: string
): {
  oldSegments: DiffSegment[];
  newSegments: DiffSegment[];
} {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  // Simple LCS (Longest Common Subsequence) based diff
  const lcs = getLCS(oldWords, newWords);

  const oldSegments: DiffSegment[] = [];
  const newSegments: DiffSegment[] = [];

  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldWords.length || newIdx < newWords.length) {
    if (
      lcsIdx < lcs.length &&
      oldIdx < oldWords.length &&
      newIdx < newWords.length &&
      oldWords[oldIdx] === lcs[lcsIdx] &&
      newWords[newIdx] === lcs[lcsIdx]
    ) {
      // Common word
      oldSegments.push({ value: oldWords[oldIdx], removed: false });
      newSegments.push({ value: newWords[newIdx], added: false });
      oldIdx++;
      newIdx++;
      lcsIdx++;
    } else if (
      oldIdx < oldWords.length &&
      (lcsIdx >= lcs.length || oldWords[oldIdx] !== lcs[lcsIdx])
    ) {
      // Removed word
      oldSegments.push({ value: oldWords[oldIdx], removed: true });
      oldIdx++;
    } else if (
      newIdx < newWords.length &&
      (lcsIdx >= lcs.length || newWords[newIdx] !== lcs[lcsIdx])
    ) {
      // Added word
      newSegments.push({ value: newWords[newIdx], added: true });
      newIdx++;
    }
  }

  return { oldSegments, newSegments };
}

/**
 * Get Longest Common Subsequence
 */
function getLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m,
    j = n;

  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Check if values are primitives that can be diffed at word level
 */
export function canWordDiff(value: any): boolean {
  return typeof value === "string" && value.length < 1000; // Only diff short strings
}
