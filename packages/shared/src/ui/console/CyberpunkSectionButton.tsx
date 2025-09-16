import { View, Text, StyleSheet } from "react-native";
import type { LucideIcon } from "rn-better-dev-tools/icons";
import { ChevronRight } from "rn-better-dev-tools/icons";
import { CyberpunkButtonOutline } from "./CyberpunkButtonOutline";
import { CyberpunkIconContainer } from "./CyberpunkIconContainer";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";

interface CyberpunkSectionButtonProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor?: string; // Made optional to avoid breaking changes
  onPress: () => void;
  index?: number;
}

export function CyberpunkSectionButton({
  id: _id,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBackgroundColor,
  onPress,
  index = 0,
}: CyberpunkSectionButtonProps) {
  return (
    <CyberpunkButtonOutline
      onPress={onPress}
      accentColor={iconColor}
      index={index}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <CyberpunkIconContainer color={iconColor} size={36}>
            <Icon size={20} color={iconColor} strokeWidth={2.5} />
          </CyberpunkIconContainer>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: gameUIColors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: iconColor }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.dataDots}>
          <View
            style={[styles.dot, { backgroundColor: iconColor, opacity: 0.9 }]}
          />
          <View
            style={[styles.dot, { backgroundColor: iconColor, opacity: 0.6 }]}
          />
          <View
            style={[styles.dot, { backgroundColor: iconColor, opacity: 0.3 }]}
          />
        </View>

        <View style={styles.arrowContainer}>
          <ChevronRight size={20} color={`${iconColor}CC`} />
        </View>
      </View>
    </CyberpunkButtonOutline>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  iconWrapper: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: "monospace",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
    letterSpacing: 0.5,
    fontFamily: "monospace",
    opacity: 0.85,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  dataDots: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    marginRight: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
