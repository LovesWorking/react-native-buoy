import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Globe,
  Upload,
  Download,
  FileJson,
  FileText,
  Image,
  Film,
  Music
} from "lucide-react-native";
import type { NetworkEvent } from "../types";

interface NetworkFilterViewProps {
  events: NetworkEvent[];
  filter: {
    status?: "all" | "success" | "error" | "pending";
    method?: string[];
    contentType?: string[];
    searchText?: string;
  };
  onFilterChange: (filter: any) => void;
  onClose: () => void;
}

// Get content type from headers with color
function getContentType(event: NetworkEvent): { type: string; color: string } {
  const headers = event.responseHeaders || event.requestHeaders;
  const contentType = headers?.["content-type"] || headers?.["Content-Type"] || "";
  
  if (contentType.includes("json")) return { type: "JSON", color: "#3B82F6" };
  if (contentType.includes("xml")) return { type: "XML", color: "#8B5CF6" };
  if (contentType.includes("html")) return { type: "HTML", color: "#F59E0B" };
  if (contentType.includes("text")) return { type: "TEXT", color: "#10B981" };
  if (contentType.includes("image")) return { type: "IMAGE", color: "#EF4444" };
  if (contentType.includes("video")) return { type: "VIDEO", color: "#EC4899" };
  if (contentType.includes("audio")) return { type: "AUDIO", color: "#6366F1" };
  if (contentType.includes("form")) return { type: "FORM", color: "#14B8A6" };
  return { type: "OTHER", color: "#6B7280" };
}

export function NetworkFilterView({ events, filter, onFilterChange, onClose }: NetworkFilterViewProps) {
  // Calculate counts for each filter option
  const statusCounts = {
    all: events.length,
    success: events.filter(e => e.status && e.status >= 200 && e.status < 300).length,
    error: events.filter(e => e.error || (e.status && e.status >= 400)).length,
    pending: events.filter(e => !e.status && !e.error).length,
  };

  const methodCounts = events.reduce((acc, event) => {
    acc[event.method] = (acc[event.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contentTypeCounts = events.reduce((acc, event) => {
    const { type } = getContentType(event);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get color for content type
  const getContentTypeColor = (type: string) => {
    const testEvent = events.find(e => getContentType(e).type === type);
    return testEvent ? getContentType(testEvent).color : "#6B7280";
  };

  const handleStatusFilter = (status: "all" | "success" | "error" | "pending") => {
    onFilterChange({ ...filter, status });
  };

  const handleMethodFilter = (method: string) => {
    const currentMethods = filter.method || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    onFilterChange({ ...filter, method: newMethods.length > 0 ? newMethods : undefined });
  };

  const handleContentTypeFilter = (type: string) => {
    const currentTypes = filter.contentType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onFilterChange({ ...filter, contentType: newTypes.length > 0 ? newTypes : undefined });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return CheckCircle;
      case "error": return XCircle;
      case "pending": return Clock;
      default: return Globe;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "JSON": return FileJson;
      case "HTML":
      case "XML":
      case "TEXT": return FileText;
      case "IMAGE": return Image;
      case "VIDEO": return Film;
      case "AUDIO": return Music;
      default: return Globe;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "#10B981";
      case "POST": return "#3B82F6";
      case "PUT": return "#F59E0B";
      case "DELETE": return "#EF4444";
      case "PATCH": return "#8B5CF6";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} sentry-label="ignore close filter">
          <X size={20} color="#E5E7EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} sentry-label="ignore filter scroll">
        {/* Status Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.filterGrid}>
            {(["all", "success", "error", "pending"] as const).map(status => {
              const Icon = getStatusIcon(status);
              const isActive = filter.status === status || (!filter.status && status === "all");
              const count = statusCounts[status];
              
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterCard, isActive && styles.activeFilterCard]}
                  onPress={() => handleStatusFilter(status)}
                  sentry-label="ignore status filter"
                >
                  <View style={[styles.filterIconContainer, { 
                    backgroundColor: status === "success" ? "rgba(16, 185, 129, 0.15)" :
                                   status === "error" ? "rgba(239, 68, 68, 0.15)" :
                                   status === "pending" ? "rgba(245, 158, 11, 0.15)" :
                                   "rgba(139, 92, 246, 0.15)"
                  }]}>
                    <Icon size={20} color={
                      status === "success" ? "#10B981" :
                      status === "error" ? "#EF4444" :
                      status === "pending" ? "#F59E0B" :
                      "#8B5CF6"
                    } />
                  </View>
                  <Text style={styles.filterLabel}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  <Text style={styles.filterCount}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Method Filters */}
        {Object.keys(methodCounts).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Method</Text>
            <View style={styles.filterGrid}>
              {Object.entries(methodCounts).map(([method, count]) => {
                const isActive = filter.method?.includes(method);
                const color = getMethodColor(method);
                
                return (
                  <TouchableOpacity
                    key={method}
                    style={[styles.filterCard, isActive && styles.activeFilterCard]}
                    onPress={() => handleMethodFilter(method)}
                    sentry-label="ignore method filter"
                  >
                    <View style={[styles.methodBadge, { backgroundColor: `${color}15` }]}>
                      <Text style={[styles.methodText, { color }]}>{method}</Text>
                    </View>
                    <Text style={styles.filterCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Content Type Filters */}
        {Object.keys(contentTypeCounts).length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Type</Text>
            <View style={styles.filterGrid}>
              {Object.entries(contentTypeCounts).map(([type, count]) => {
                const Icon = getContentTypeIcon(type);
                const isActive = filter.contentType?.includes(type);
                
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterCard, isActive && styles.activeFilterCard]}
                    onPress={() => handleContentTypeFilter(type)}
                    sentry-label="ignore content type filter"
                  >
                    <View style={[styles.filterIconContainer, {
                      backgroundColor: `${getContentTypeColor(type)}15`
                    }]}>
                      <Icon size={16} color={getContentTypeColor(type)} />
                    </View>
                    <Text style={styles.filterLabel}>{type}</Text>
                    <Text style={styles.filterCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  activeFilterCard: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "#8B5CF6",
  },
  filterIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: "#E5E7EB",
    marginBottom: 4,
  },
  filterCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  methodText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});