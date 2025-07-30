import { StyleSheet, Text, View } from "react-native";
import { Database } from "lucide-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ExpandableSectionWithModal } from "../ExpandableSectionWithModal";
import DevTools from "../../../../DevTools";

interface ReactQuerySectionProps {
  queryClient?: QueryClient;
}

export function ReactQuerySection({
  queryClient: propQueryClient,
}: ReactQuerySectionProps) {
  // Use provided queryClient
  const queryClient = propQueryClient;

  // Simple static subtitle generation without continuous subscriptions
  const getSubtitle = () => {
    if (!queryClient) {
      return "QueryClient not available";
    }

    try {
      // Get current snapshot without subscribing
      const allQueries = queryClient.getQueryCache().findAll();
      const allMutations = queryClient.getMutationCache().getAll();

      return `${allQueries.length} queries • ${allMutations.length} mutations`;
    } catch (error) {
      return "React Query Dev Tools";
    }
  };

  // If no queryClient is available, show error in modal
  if (!queryClient) {
    return (
      <ExpandableSectionWithModal
        icon={Database}
        iconColor="#EF4444"
        iconBackgroundColor="rgba(239, 68, 68, 0.1)"
        title="React Query Dev Tools"
        subtitle="QueryClient not available"
        fullScreen={true}
        showModalHeader={true}
      >
        {() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              No QueryClient found. Please either:
            </Text>
            <Text style={styles.errorBullet}>
              • Wrap your app with QueryClientProvider, or
            </Text>
            <Text style={styles.errorBullet}>
              • Pass queryClient prop to FloatingStatusBubble
            </Text>
          </View>
        )}
      </ExpandableSectionWithModal>
    );
  }

  // Render the main expandable section
  return (
    <ExpandableSectionWithModal
      icon={Database}
      iconColor="#0EA5E9"
      iconBackgroundColor="rgba(14, 165, 233, 0.1)"
      title="React Query Dev Tools"
      subtitle={getSubtitle()}
      fullScreen={true}
      showModalHeader={false} // DevTools has its own header
    >
      {(closeModal) => (
        <QueryClientProvider client={queryClient}>
          <DevTools setShowDevTools={closeModal} queryClient={queryClient} />
        </QueryClientProvider>
      )}
    </ExpandableSectionWithModal>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  errorBullet: {
    color: "#F87171",
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 4,
  },
});
