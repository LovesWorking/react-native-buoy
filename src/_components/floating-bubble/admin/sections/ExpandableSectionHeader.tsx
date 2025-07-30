import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';

interface ExpandableSectionHeaderProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onPress: () => void;
}

export function ExpandableSectionHeader({
  icon: Icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  isExpanded,
  onPress,
}: ExpandableSectionHeaderProps) {
  return (
    <TouchableOpacity
      sentry-label="ignore expand section button"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          {isExpanded ? <ChevronDown size={18} color="#4B5563" /> : <ChevronRight size={18} color="#4B5563" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  chevronContainer: {
    paddingTop: 6,
  },
});
