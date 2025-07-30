import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Metadata } from '../../../logger/types';

interface SentryInfoCardProps {
  metadata: Metadata;
}

export const SentryInfoCard = memo(({ metadata }: SentryInfoCardProps) => {
  const sentryEventType = metadata.sentryEventType as string | undefined;
  const sentrySource = metadata.sentrySource as string | undefined;
  const sentryLevel = metadata.sentryLevel as string | undefined;

  const hasInfo = sentryEventType || sentrySource || sentryLevel;

  if (!hasInfo) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>SENTRY EVENT INFO</Text>
      <View style={styles.container}>
        {sentryEventType && (
          <View style={styles.row}>
            <Text style={styles.key}>Type:</Text>
            <Text style={styles.value}>{sentryEventType}</Text>
          </View>
        )}
        {sentrySource && (
          <View style={styles.row}>
            <Text style={styles.key}>Source:</Text>
            <Text style={styles.value}>{sentrySource}</Text>
          </View>
        )}
        {sentryLevel && (
          <View style={styles.row}>
            <Text style={styles.key}>Level:</Text>
            <Text style={styles.value}>{sentryLevel}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

SentryInfoCard.displayName = 'SentryInfoCard';

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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  key: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
