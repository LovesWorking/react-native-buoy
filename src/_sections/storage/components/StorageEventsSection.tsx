import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Database, ChevronRight } from "lucide-react-native";

interface StorageEventsSectionProps {
  onPress: () => void;
  eventCount?: number;
}

export function StorageEventsSection({ onPress, eventCount = 0 }: StorageEventsSectionProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel="Storage Events"
      sentry-label="ignore storage events section"
    >
      <View style={styles.iconContainer}>
        <Database size={22} color="#10B981" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Storage Events</Text>
        <Text style={styles.subtitle}>
          {eventCount > 0 ? `${eventCount} events captured` : 'Monitor AsyncStorage operations'}
        </Text>
      </View>
      
      <ChevronRight size={20} color="#6B7280" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
});