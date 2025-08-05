import { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("RnBetterDevToolsBubble Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <AlertTriangle color="#EF4444" size={20} />
            <Text style={styles.errorTitle}>Dev Tools Error</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || "Something went wrong"}
            </Text>
            <TouchableOpacity
              sentry-label="ignore devtools error boundary retry"
              style={styles.retryButton}
              onPress={this.handleRetry}
            >
              <RefreshCw color="#60A5FA" size={16} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: "#171717",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#EF4444",
    padding: 12,
    minWidth: 200,
    maxWidth: 300,
  },
  errorContent: {
    alignItems: "center",
    gap: 8,
  },
  errorTitle: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  errorMessage: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    borderWidth: 1,
    borderColor: "#60A5FA",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  retryText: {
    color: "#60A5FA",
    fontSize: 12,
    fontWeight: "500",
  },
});
