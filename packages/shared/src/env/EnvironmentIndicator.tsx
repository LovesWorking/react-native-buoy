import { LayoutChangeEvent, Text, View } from "react-native";
import {
  FlaskConical,
  TestTube2,
  Bug,
  Zap,
  type LucideIcon,
  gameUIColors,
} from "../index";

import { Environment } from "../types/types";
interface EnvironmentIndicatorProps {
  environment: Environment;
  onLayout?: (event: LayoutChangeEvent) => void;
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
}: EnvironmentIndicatorProps) {
  const envConfig = getEnvironmentConfig(environment);

  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingLeft: 8,
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
    </View>
  );
}
