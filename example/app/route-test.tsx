import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from 'expo-router';

export default function RouteTestScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Route DevTools</Text>
          <Text style={styles.subtitle}>Test Navigation</Text>
          <Text style={styles.description}>
            Explore different route types to test the DevTools functionality
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Static Routes</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/about')}
            >
              <Text style={styles.buttonText}>About</Text>
              <Text style={styles.routePattern}>/about</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.buttonText}>Settings</Text>
              <Text style={styles.routePattern}>/settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dynamic Routes</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/user/123')}
            >
              <Text style={styles.buttonText}>User Profile</Text>
              <Text style={styles.routePattern}>/user/[id]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/pokemon/pikachu')}
            >
              <Text style={styles.buttonText}>Pokemon Detail</Text>
              <Text style={styles.routePattern}>/pokemon/[id]</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nested Dynamic Routes</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/blog/2024/react-native-tips')}
            >
              <Text style={styles.buttonText}>Blog Post</Text>
              <Text style={styles.routePattern}>/blog/[year]/[slug]</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catch-all Routes</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/docs/getting-started')}
            >
              <Text style={styles.buttonText}>Documentation</Text>
              <Text style={styles.routePattern}>/docs/[...path]</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F5F5F7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#34C759',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 300,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F7',
    marginBottom: 12,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    backgroundColor: '#1A1A1C',
    padding: 16,
    borderRadius: 8,
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
    marginBottom: 4,
  },
  routePattern: {
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
