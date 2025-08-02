import { LayoutChangeEvent, Text, View } from "react-native";
import { FlaskConical, TestTube2, Bug, Zap } from "lucide-react-native";

export type Environment = "local" | "dev" | "qa" | "staging" | "prod";

interface EnvironmentIndicatorProps {
  environment: Environment;
  onLayout?: (event: LayoutChangeEvent) => void;
}

interface EnvironmentConfig {
  label: string;
  backgroundColor: string;
  icon: typeof FlaskConical;
  isLocal: boolean;
}

function getEnvironmentConfig(environment: Environment): EnvironmentConfig {
  switch (environment) {
    case "local":
      return {
        label: "LOCAL",
        backgroundColor: "#06B6D4",
        icon: FlaskConical,
        isLocal: true,
      };
    case "dev":
      return {
        label: "DEV",
        backgroundColor: "#F97316",
        icon: FlaskConical,
        isLocal: false,
      };
    case "qa":
      return {
        label: "QA",
        backgroundColor: "#8B5CF6",
        icon: Bug,
        isLocal: false,
      };
    case "staging":
      return {
        label: "STAGING",
        backgroundColor: "#10B981",
        icon: Zap,
        isLocal: false,
      };
    case "prod":
      return {
        label: "PROD",
        backgroundColor: "#DC2626",
        icon: TestTube2,
        isLocal: false,
      };
    default:
      return {
        label: "LOCAL",
        backgroundColor: "#06B6D4",
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
          color: "#F9FAFB",
          letterSpacing: 0.5,
        }}
      >
        {envConfig.label}
      </Text>
    </View>
  );
}
