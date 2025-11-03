import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function BlogPostScreen() {
  const router = useRouter();
  const { year, slug } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Blog Post</Text>
        <Text style={styles.subtitle}>Nested Dynamic Route: /blog/[year]/[slug]</Text>
        <View style={styles.paramsContainer}>
          <Text style={styles.paramLabel}>Year:</Text>
          <Text style={styles.paramValue}>{year}</Text>
        </View>
        <View style={styles.paramsContainer}>
          <Text style={styles.paramLabel}>Slug:</Text>
          <Text style={styles.paramValue}>{slug}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/blog/2024/react-native-tips')}
        >
          <Text style={styles.buttonText}>Blog: React Native Tips (2024)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/blog/2023/expo-router-guide')}
        >
          <Text style={styles.buttonText}>Blog: Expo Router Guide (2023)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/blog/2025/navigation-patterns')}
        >
          <Text style={styles.buttonText}>Blog: Navigation Patterns (2025)</Text>
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
  paramsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paramLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  paramValue: {
    fontSize: 20,
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
