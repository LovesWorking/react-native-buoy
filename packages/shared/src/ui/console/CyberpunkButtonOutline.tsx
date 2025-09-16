import { ReactNode, useState, useRef } from "react";
import { View, ViewStyle, Pressable, Animated } from "react-native";
import Svg, {
  Defs,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  Path,
  G,
  Line,
  LinearGradient,
  Stop,
} from "react-native-svg";

interface CyberpunkButtonOutlineProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accentColor?: string;
  index?: number;
}

export function CyberpunkButtonOutline({
  children,
  onPress,
  style,
  accentColor,
  index = 0,
}: CyberpunkButtonOutlineProps) {
  const [isPressed, setIsPressed] = useState(false);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  // Use a slightly lighter/adjusted version of the accent color for secondary elements
  const getSecondaryColor = () => {
    // Return a slightly adjusted version of the accent color
    return accentColor;
  };

  const secondaryColor = getSecondaryColor();

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View
        style={{
          position: "relative",
          height: 80,
          marginBottom: 12,
          transform: [{ scale: animatedScale }],
          opacity: animatedOpacity,
        }}
      >
        <View style={{ position: "absolute", width: "100%", height: "100%" }}>
          <Svg viewBox="0 0 280 80" style={{ width: "100%", height: "100%" }}>
            <Defs>
              <LinearGradient
                id={`cyberGradient${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor={accentColor} stopOpacity="1" />
                <Stop offset="50%" stopColor={accentColor} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={accentColor} stopOpacity="0.6" />
              </LinearGradient>

              <LinearGradient
                id={`secondaryGradient${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
                <Stop
                  offset="100%"
                  stopColor={secondaryColor}
                  stopOpacity="0.6"
                />
              </LinearGradient>

              <Filter
                id={`strongGlow${index}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <FeGaussianBlur stdDeviation="4" result="coloredBlur" />
                <FeMerge>
                  <FeMergeNode in="coloredBlur" />
                  <FeMergeNode in="coloredBlur" />
                  <FeMergeNode in="SourceGraphic" />
                </FeMerge>
              </Filter>

              <Filter
                id={`electricGlow${index}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <FeGaussianBlur stdDeviation="3" result="coloredBlur" />
                <FeMerge>
                  <FeMergeNode in="coloredBlur" />
                  <FeMergeNode in="SourceGraphic" />
                </FeMerge>
              </Filter>
            </Defs>
            <Path
              d="M 15 5 L 250 5 L 270 25 L 270 55 L 255 70 L 25 70 L 10 55 L 10 25 Z"
              fill="none"
              stroke={`url(#cyberGradient${index})`}
              strokeWidth={isPressed ? 3 : 2.5}
              filter={`url(#strongGlow${index})`}
              opacity={isPressed ? 1 : 0.95}
            />
            <Path
              d="M 18 8 L 247 8 L 267 28 L 267 52 L 252 67 L 28 67 L 13 52 L 13 28 Z"
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              opacity={0.8}
              filter={`url(#electricGlow${index})`}
            />
            <G
              stroke={accentColor}
              strokeWidth={1}
              fill="none"
              opacity={0.6}
              filter={`url(#electricGlow${index})`}
            >
              <Line x1={250} y1={5} x2={245} y2={10} />
              <Line x1={250} y1={5} x2={255} y2={10} />
              <Line x1={270} y1={25} x2={265} y2={20} />
              <Line x1={270} y1={25} x2={265} y2={30} />
            </G>
            <G
              stroke={accentColor}
              strokeWidth={1}
              fill="none"
              opacity={0.6}
              filter={`url(#electricGlow${index})`}
            >
              <Line x1={270} y1={55} x2={265} y2={50} />
              <Line x1={270} y1={55} x2={265} y2={60} />
              <Line x1={255} y1={70} x2={260} y2={65} />
              <Line x1={255} y1={70} x2={250} y2={65} />
            </G>
            <G
              stroke={accentColor}
              strokeWidth={1}
              fill="none"
              opacity={0.6}
              filter={`url(#electricGlow${index})`}
            >
              <Line x1={25} y1={70} x2={30} y2={65} />
              <Line x1={25} y1={70} x2={20} y2={65} />
              <Line x1={10} y1={55} x2={15} y2={60} />
              <Line x1={10} y1={55} x2={15} y2={50} />
            </G>
            <G
              stroke={accentColor}
              strokeWidth={1}
              fill="none"
              opacity={0.6}
              filter={`url(#electricGlow${index})`}
            >
              <Line x1={10} y1={25} x2={15} y2={30} />
              <Line x1={10} y1={25} x2={15} y2={20} />
              <Line x1={15} y1={5} x2={20} y2={10} />
              <Line x1={15} y1={5} x2={25} y2={10} />
            </G>
          </Svg>
        </View>

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            paddingLeft: 35,
            paddingRight: 25,
            paddingVertical: 12,
            justifyContent: "center",
          }}
        >
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
}
