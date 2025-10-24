import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function UserScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.subtitle}>Dynamic Route: /user/[id]</Text>
      <Text style={styles.paramText}>User ID: {id}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/user/456')}
        >
          <Text style={styles.buttonText}>Go to User 456</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/user/789')}
        >
          <Text style={styles.buttonText}>Go to User 789</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
    padding: 20,
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
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  paramText: {
    fontSize: 20,
    color: '#34C759',
    marginBottom: 32,
    fontFamily: 'monospace',
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
