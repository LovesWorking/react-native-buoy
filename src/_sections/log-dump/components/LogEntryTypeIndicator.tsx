import { StyleSheet, Text, View } from 'react-native';

import { LogType } from '../../../_shared/logger/types';
import { getTypeColor, getTypeIcon } from '../utils';

interface LogEntryTypeIndicatorProps {
  type: LogType;
}

export const LogEntryTypeIndicator = ({ type }: LogEntryTypeIndicatorProps) => {
  const IconComponent = getTypeIcon(type);
  const typeColor = getTypeColor(type);

  return (
    <View style={styles.typeIndicator}>
      {IconComponent && <IconComponent size={12} color={typeColor} />}
      <Text style={[styles.typeText, { color: typeColor }]}>{type}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});
