import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import type { LucideIcon } from "rn-better-dev-tools/icons";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  color?: string;
  isActive?: boolean;
  value?: any;
}

export interface FilterChipGroup {
  id: string;
  title: string;
  chips: FilterChip[];
  multiSelect?: boolean;
}

interface CompactFilterChipsProps {
  groups: FilterChipGroup[];
  onChipPress: (groupId: string, chipId: string, value: any) => void;
}

export function CompactFilterChips({ groups, onChipPress }: CompactFilterChipsProps) {
  return (
    <View style={styles.container}>
      {groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
          >
            <View style={styles.chipsRow}>
              {group.chips.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.chip,
                    chip.isActive && styles.chipActive,
                    chip.isActive && chip.color && {
                      backgroundColor: chip.color + "15",
                      borderColor: chip.color + "40",
                    },
                  ]}
                  onPress={() => onChipPress(group.id, chip.id, chip.value)}
                >
                  {chip.icon && (
                    <chip.icon 
                      size={10} 
                      color={chip.isActive ? (chip.color || macOSColors.semantic.info) : macOSColors.text.muted} 
                    />
                  )}
                  <Text 
                    style={[
                      styles.chipLabel,
                      chip.isActive && styles.chipLabelActive,
                      chip.isActive && chip.color && { color: chip.color },
                    ]}
                  >
                    {chip.label}
                  </Text>
                  {chip.count !== undefined && (
                    <Text 
                      style={[
                        styles.chipCount,
                        chip.isActive && styles.chipCountActive,
                        chip.isActive && chip.color && { color: chip.color },
                      ]}
                    >
                      {chip.count}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.text.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: macOSColors.background.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    height: 24,
  },
  chipActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "40",
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: macOSColors.text.secondary,
  },
  chipLabelActive: {
    color: macOSColors.semantic.info,
    fontWeight: "600",
  },
  chipCount: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.text.muted,
    backgroundColor: macOSColors.background.hover,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  chipCountActive: {
    backgroundColor: macOSColors.semantic.info + "20",
    color: macOSColors.semantic.info,
  },
});