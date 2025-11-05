import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function DocsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // The path parameter is an array for catch-all routes
  const path = params.path;
  const pathArray = Array.isArray(path) ? path : [path];
  const pathString = pathArray.join(' / ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentation</Text>
        <Text style={styles.subtitle}>Catch-all Route: /docs/[...path]</Text>
        <View style={styles.pathContainer}>
          <Text style={styles.pathLabel}>Path segments:</Text>
          <Text style={styles.pathValue}>{pathString || '(none)'}</Text>
        </View>
        <View style={styles.pathContainer}>
          <Text style={styles.pathLabel}>Depth:</Text>
          <Text style={styles.pathValue}>{pathArray.length}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/docs/getting-started')}
        >
          <Text style={styles.buttonText}>Docs: Getting Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/docs/api/components')}
        >
          <Text style={styles.buttonText}>Docs: API / Components</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/docs/guides/navigation/advanced')}
        >
          <Text style={styles.buttonText}>Docs: Guides / Navigation / Advanced</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/docs/reference/hooks/useRouter')}
        >
          <Text style={styles.buttonText}>Docs: Reference / Hooks / useRouter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5F5F7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  pathValue: {
    fontSize: 18,
    color: '#34C759',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#1A1A1C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2F',
  },
  backButton: {
    backgroundColor: '#FF453A',
    borderColor: '#FF6961',
  },
  buttonText: {
    color: '#F5F5F7',
    fontSize: 16,
    fontWeight: '600',
  },
});
