import { FC, PropsWithChildren } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export const ModalHeader: FC<PropsWithChildren<{}>> & {
  Content: FC<PropsWithChildren<{ title?: string; noMargin?: boolean }>>;
  Actions: FC<{ onClose?: () => void }>;
} = (({ children }: PropsWithChildren<{}>) => {
  return (
    <View
      style={{
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {children}
    </View>
  );
}) as any;

ModalHeader.Content = ({ title, noMargin, children }) => (
  <View style={{ flex: 1, marginBottom: noMargin ? 0 : 8 }}>
    {!!title && (
      <Text style={{ color: "#E6EEFF", fontWeight: "700", marginBottom: 4 }}>
        {title}
      </Text>
    )}
    <View>{children}</View>
  </View>
);

ModalHeader.Actions = ({ onClose }) => (
  <TouchableOpacity
    onPress={onClose}
    style={{ paddingHorizontal: 10, paddingVertical: 6 }}
  >
    <Text style={{ color: "#FF5252", fontWeight: "700" }}>Close</Text>
  </TouchableOpacity>
);
