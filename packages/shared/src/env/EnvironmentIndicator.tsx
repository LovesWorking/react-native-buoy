import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import {
  FlaskConical,
  TestTube2,
  Bug,
  Zap,
  ChevronDown,
  type LucideIcon,
} from "../icons";
import { gameUIColors } from "../ui/gameUI/constants/gameUIColors";

import { Environment } from "../types/types";

export interface EnvironmentIndicatorProps {
  environment: Environment;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** When true, the badge becomes pressable and shows a dropdown indicator */
  interactive?: boolean;
  /** Called when the badge is pressed (only when interactive is true) */
  onPress?: () => void;
}

interface EnvironmentConfig {
  label: string;
  backgroundColor: string;
  icon: LucideIcon;
  isLocal: boolean;
}

function getEnvironmentConfig(environment: Environment): EnvironmentConfig {
  switch (environment) {
    case "local":
      return {
        label: "LOCAL",
        backgroundColor: gameUIColors.info,
        icon: FlaskConical,
        isLocal: true,
      };
    case "dev":
      return {
        label: "DEV",
        backgroundColor: gameUIColors.warning,
        icon: FlaskConical,
        isLocal: false,
      };
    case "qa":
      return {
        label: "QA",
        backgroundColor: gameUIColors.optional,
        icon: Bug,
        isLocal: false,
      };
    case "staging":
      return {
        label: "STAGING",
        backgroundColor: gameUIColors.success,
        icon: Zap,
        isLocal: false,
      };
    case "prod":
      return {
        label: "PROD",
        backgroundColor: gameUIColors.error,
        icon: TestTube2,
        isLocal: false,
      };
    default:
      return {
        label: "LOCAL",
        backgroundColor: gameUIColors.info,
        icon: FlaskConical,
        isLocal: true,
      };
  }
}

export function EnvironmentIndicator({
  environment,
  onLayout,
  interactive = false,
  onPress,
}: EnvironmentIndicatorProps) {
  const envConfig = getEnvironmentConfig(environment);

  const content = (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingLeft: 8,
        paddingRight: interactive ? 4 : 8,
        flexShrink: 0,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: envConfig.backgroundColor,
          marginRight: 6,
          shadowColor: envConfig.backgroundColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
          elevation: 2,
        }}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          fontFamily: "Poppins-SemiBold",
          color: gameUIColors.primaryLight,
          letterSpacing: 0.5,
        }}
      >
        {envConfig.label}
      </Text>
      {interactive && (
        <ChevronDown
          size={12}
          color={gameUIColors.muted}
          style={{ marginLeft: 2 }}
        />
      )}
    </View>
  );

  if (interactive && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={`Current environment: ${envConfig.label}. Tap to switch environment.`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
