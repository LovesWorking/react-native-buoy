import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@monorepo/shared';

export interface ExampleComponentProps {
  text?: string;
  onPress?: () => void;
}

export function ExampleComponent({
  text = 'Example Component',
  onPress
}: ExampleComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <Button title="Click Me" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
  },
});
