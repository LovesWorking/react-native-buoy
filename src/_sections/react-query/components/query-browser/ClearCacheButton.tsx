import { TouchableOpacity, StyleSheet } from "react-native";
import { Svg, Path } from "react-native-svg";

interface ClearCacheButtonProps {
  type: "queries" | "mutations";
  onClear: () => void;
  disabled?: boolean;
}

const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({
  type,
  onClear,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      sentry-label="ignore devtools clear cache button"
      style={[styles.button, disabled && styles.disabledButton]}
      onPress={onClear}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel={`Clear ${type} cache`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <TrashIcon />
    </TouchableOpacity>
  );
};

// Trash icon component
const TrashIcon = () => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path
      stroke="#F97316"
      d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
    />
  </Svg>
);

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.2)",
  },
});

export default ClearCacheButton;
