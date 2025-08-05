import { StyleSheet, Text, View } from 'react-native';

import { LogLevel } from '../../../_shared/logger/types';
import { getLevelDotStyle, getLevelTextColor } from '../utils';

interface LogEntryLevelIndicatorProps {
  level: LogLevel;
}

export const LogEntryLevelIndicator = ({ level }: LogEntryLevelIndicatorProps) => {
  return (
    <>
      <View style={[styles.levelDot, getLevelDotStyle(level)]} />
      <Text style={[styles.levelText, { color: getLevelTextColor(level) }]}>{level.toUpperCase()}</Text>
    </>
  );
};

const styles = StyleSheet.create({
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
});
