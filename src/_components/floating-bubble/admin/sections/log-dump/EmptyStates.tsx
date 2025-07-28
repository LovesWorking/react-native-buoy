import { StyleSheet, Text, View } from 'react-native';

export const EmptyState = () => (
  <View style={styles.container}>
    <View style={styles.messageContainer}>
      <Text style={styles.primaryText}>No log entries found</Text>
      <Text style={styles.secondaryText}>Logs will appear here as the app generates them</Text>
    </View>
  </View>
);

export const EmptyFilterState = () => (
  <View style={styles.container}>
    <View style={styles.messageContainer}>
      <Text style={styles.primaryText}>No matching entries</Text>
      <Text style={styles.secondaryText}>Try adjusting your filters to see more entries</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  secondaryText: {
    color: '#4B5563',
    fontSize: 14,
    textAlign: 'center',
  },
});
