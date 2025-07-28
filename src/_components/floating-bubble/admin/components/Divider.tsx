import { View } from 'react-native';

export function Divider() {
  return (
    <View
      style={{
        width: 1,
        height: 12,
        backgroundColor: 'rgba(107, 114, 128, 0.4)',
        flexShrink: 0,
      }}
    />
  );
}
