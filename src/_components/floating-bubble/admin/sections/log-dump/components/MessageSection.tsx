import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MessageSectionProps {
  message: string | Error;
}

export const MessageSection = memo(({ message }: MessageSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>MESSAGE</Text>
      <View style={styles.container}>
        <Text style={styles.messageText} selectable>
          {String(message)}
        </Text>
      </View>
    </View>
  );
});

MessageSection.displayName = 'MessageSection';

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
});
