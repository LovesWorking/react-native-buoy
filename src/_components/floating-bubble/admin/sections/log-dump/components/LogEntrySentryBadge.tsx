import { StyleSheet, Text, View } from 'react-native';

import { Metadata } from '../../../logger/types';

interface LogEntrySentryBadgeProps {
  metadata: Metadata;
}

export const LogEntrySentryBadge = ({ metadata }: LogEntrySentryBadgeProps) => {
  // Only show the sentry event type, not the redundant source
  // This fixes the "Span • span" issue by showing only "Span"
  if (!metadata.sentryEventType) {
    return null;
  }

  return (
    <View style={styles.sentryBadge}>
      <Text style={styles.sentryBadgeText}>{String(metadata.sentryEventType)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sentryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  sentryBadgeText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
});
