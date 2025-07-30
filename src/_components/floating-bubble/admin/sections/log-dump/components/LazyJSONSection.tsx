import { memo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import JSONTree from "react-native-json-tree";
import { ChevronDown, ChevronRight } from "lucide-react-native";

import { Copy } from "lucide-react-native";

import { jsonTreeTheme } from "../constants";

interface LazyJSONSectionProps {
  title: string;
  data: unknown;
  defaultExpanded?: boolean;
}

export const LazyJSONSection = memo(
  ({ title, data, defaultExpanded = false }: LazyJSONSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isLoaded, setIsLoaded] = useState(defaultExpanded);
    const [copyFeedback, setCopyFeedback] = useState<"copied" | "error" | null>(
      null
    );

    const toggleExpanded = () => {
      if (!isLoaded && !isExpanded) {
        // Defer loading until first expansion
        setIsLoaded(true);
      }
      setIsExpanded(!isExpanded);
    };

    const handleCopy = async () => {
      try {
        const jsonString = JSON.stringify(data, null, 2);
        // await Clipboard.setStringAsync(jsonString);
        throw new Error("Not implemented");
        setCopyFeedback("copied");
        setTimeout(() => setCopyFeedback(null), 2000);
      } catch (error) {
        setCopyFeedback("error");
        setTimeout(() => setCopyFeedback(null), 2000);
      }
    };

    const hasData =
      data &&
      typeof data === "object" &&
      Object.keys(data as object).length > 0;

    if (!hasData) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={10}
            style={styles.expandButton}
            onPress={toggleExpanded}
            accessibilityRole="button"
            accessibilityLabel={`${
              isExpanded ? "Collapse" : "Expand"
            } ${title}`}
            accessibilityHint={`${
              isExpanded ? "Hide" : "Show"
            } ${title} details`}
            sentry-label={`ignore toggle ${title.toLowerCase()} section`}
          >
            <Text style={styles.sectionLabel}>{title}</Text>
            {isExpanded ? (
              <ChevronDown size={16} color="#9CA3AF" />
            ) : (
              <ChevronRight size={16} color="#9CA3AF" />
            )}
          </TouchableOpacity>

          <View style={styles.copyContainer}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={`Copy ${title} data`}
              accessibilityHint={`Copy ${title} JSON data to clipboard`}
              sentry-label={`ignore copy ${title.toLowerCase()} data`}
              hitSlop={10}
            >
              <Copy size={16} color="#9CA3AF" />
            </TouchableOpacity>
            {copyFeedback && (
              <Text
                style={[
                  styles.feedbackText,
                  copyFeedback === "error" && styles.errorText,
                ]}
              >
                {copyFeedback === "copied" ? "Copied!" : "Error"}
              </Text>
            )}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.jsonContainer}>
            {isLoaded ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                sentry-label={`ignore ${title.toLowerCase()} horizontal scroll`}
              >
                <View style={styles.jsonContent}>
                  <JSONTree
                    data={data as Record<string, unknown>}
                    theme={jsonTreeTheme}
                    invertTheme={false}
                    hideRoot
                    shouldExpandNode={(keyPath) => {
                      // Only expand first level by default for performance
                      return keyPath.length <= 1;
                    }}
                  />
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
        )}
      </View>
    );
  }
);

LazyJSONSection.displayName = "LazyJSONSection";

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  expandButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  copyContainer: {
    position: "relative",
    alignItems: "center",
  },
  copyButton: {
    padding: 8,
    borderRadius: 4,
  },
  feedbackText: {
    position: "absolute",
    top: -10,
    color: "#4ADE80",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    minWidth: 50,
  },
  errorText: {
    color: "#EF4444",
  },
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  jsonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  jsonContent: {
    flex: 1,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
});
