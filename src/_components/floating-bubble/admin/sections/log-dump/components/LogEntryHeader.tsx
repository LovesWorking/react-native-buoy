import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { ConsoleTransportEntry } from '../../../logger/types';
import { formatTimestamp } from '../utils';

import { LogEntryLevelIndicator } from './LogEntryLevelIndicator';
import { LogEntryTypeIndicator } from './LogEntryTypeIndicator';

interface LogEntryHeaderProps {
  entry: ConsoleTransportEntry;
}

export const LogEntryHeader = ({ entry }: LogEntryHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <LogEntryTypeIndicator type={entry.type} />
        <LogEntryLevelIndicator level={entry.level} />
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</Text>
        <ChevronRight size={12} color="#6B7280" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
