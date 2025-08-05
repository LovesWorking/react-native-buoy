import { LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';

export type UserRole = 'admin' | 'internal' | 'user';

interface UserStatusProps {
  userRole: UserRole;
  onPress: () => void;
  isDragging: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}

function getUserStatusConfig(userRole: UserRole) {
  switch (userRole) {
    case 'admin':
      return {
        label: 'Admin',
        dotColor: '#10B981',
        textColor: '#10B981',
      };
    case 'internal':
      return {
        label: 'Internal',
        dotColor: '#6366F1',
        textColor: '#A5B4FC',
      };
    case 'user':
    default:
      return {
        label: 'User',
        dotColor: '#6B7280',
        textColor: '#9CA3AF',
      };
  }
}

export function UserStatus({ userRole, onPress, isDragging, onLayout }: UserStatusProps) {
  const statusConfig = getUserStatusConfig(userRole);

  return (
    <TouchableOpacity
      onLayout={onLayout}
      sentry-label="ignore toggle admin modal button"
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      disabled={isDragging}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        flexShrink: 0,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: statusConfig.dotColor,
          marginRight: 4,
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: '500',
          fontFamily: 'Poppins-Medium',
          color: statusConfig.textColor,
          letterSpacing: 0.3,
        }}
      >
        {statusConfig.label}
      </Text>
    </TouchableOpacity>
  );
}
