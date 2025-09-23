import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/** Props accepted by the placeholder storage component. */
export interface StorageProps {
  /** Optional heading displayed in the sample view. */
  title?: string;
}

/**
 * Placeholder component used for quick smoke tests. Import from the `/storage` subpath for the
 * full tooling surface.
 */
export function StorageComponent({
  title = 'storage Component'
}: StorageProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        This is a new package created with create-package script
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
