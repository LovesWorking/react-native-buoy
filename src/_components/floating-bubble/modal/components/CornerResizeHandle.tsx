import { useState } from 'react';
import { View, StyleSheet } from "react-native";

const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

interface CornerResizeHandleProps {
  handler: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  isActive?: boolean;
}

export const CornerResizeHandle = ({
  handler,
  isActive,
}: CornerResizeHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <View
      style={[
        styles.cornerHandle,
        styles[handler],
        (isDragging || isActive) && styles.cornerHandleDragging,
      ]}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchCancel={() => setIsDragging(false)}
      hitSlop={HIT_SLOP}
    />
  );
};

const styles = StyleSheet.create({
  cornerHandle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10, // Perfect circle (width/height / 2)
    zIndex: 1000,
    // Invisible by default - no background or border
  },
  topLeft: {
    top: 4,
    left: 4,
  },
  topRight: {
    top: 4,
    right: 4,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
  },
  cornerHandleDragging: {
    backgroundColor: "rgba(34, 197, 94, 0.1)", // Same green as FloatingStatusBubble
    borderColor: "rgba(34, 197, 94, 1)", // Same green border as FloatingStatusBubble
    borderWidth: 2,
    // Add subtle shadow like the bubble
    shadowColor: "rgba(34, 197, 94, 0.6)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
