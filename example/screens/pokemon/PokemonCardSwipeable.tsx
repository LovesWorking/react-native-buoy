import { useRef, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePokemon } from "./usePokemon";
import { PokemonTheme } from "./constants/PokemonTheme";
import { getTypeColor } from "./pokemonTypeColors";

const { width } = Dimensions.get("window");

interface PokemonCardSwipeableProps {
  pokemonId: string;
  index: number;
  isActive: boolean;
  onSwipe: (result: {
    direction: "left" | "right";
    pokemonId: string;
  }) => void;
  shimmerAnim: any;
  floatAnim: any;
  cardGlowAnim: any;
  onTypeChange?: (type: string) => void;
}

export function PokemonCardSwipeable({
  pokemonId,
  index,
  isActive,
  onSwipe,
  shimmerAnim,
  floatAnim,
  cardGlowAnim,
  onTypeChange,
}: PokemonCardSwipeableProps) {
  const { data, isLoading } = usePokemon(pokemonId);

  // Use React Native Animated Values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(
    new Animated.Value(index === 0 ? 1 : 1 - index * 0.05)
  ).current;
  const gestureRotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(
    new Animated.Value(index === 0 ? 1 : index < 3 ? 0.8 : 0)
  ).current;
  const decisionProgress = useRef(new Animated.Value(0)).current;
  const swipeDirectionRef = useRef<"left" | "right" | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | null
  >(null);

  useEffect(() => {
    if (index === 0) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      ]).start();
    } else if (index === 1) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 8, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 8, useNativeDriver: true }),
        Animated.spring(opacity, { toValue: 0.9, useNativeDriver: true }),
      ]).start();
    } else if (index === 2) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 16, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 16, useNativeDriver: true }),
        Animated.spring(opacity, { toValue: 0.8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(opacity, { toValue: 0, useNativeDriver: true }).start();
    }
  }, [index, opacity, scale, translateX, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => isActive,
        onPanResponderGrant: () => {
          // Stop any ongoing animations when starting a gesture
          if (isActive) {
            translateX.stopAnimation();
            translateY.stopAnimation();
            gestureRotation.stopAnimation();
            opacity.stopAnimation();
          }
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (!isActive) return;

          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy / 4 + index * -10);

          // Manual interpolation for rotation
          const rotationValue = (gestureState.dx / width) * 30;
          gestureRotation.setValue(Math.max(-30, Math.min(30, rotationValue)));

          // Manual interpolation for opacity
          const opacityValue = 1 - (Math.abs(gestureState.dx) / width) * 0.7;
          opacity.setValue(Math.max(0.3, Math.min(1, opacityValue)));

          const absoluteDx = Math.abs(gestureState.dx);
          const nextProgress = Math.min(1, absoluteDx / (width * 0.45));
          decisionProgress.setValue(nextProgress);

          if (absoluteDx < 12) {
            if (swipeDirectionRef.current !== null) {
              swipeDirectionRef.current = null;
              setSwipeDirection(null);
            }
          } else {
            const nextDirection = gestureState.dx >= 0 ? "right" : "left";
            if (swipeDirectionRef.current !== nextDirection) {
              swipeDirectionRef.current = nextDirection;
              setSwipeDirection(nextDirection);
            }
          }
        },
        onPanResponderRelease: (_evt, gestureState) => {
          if (!isActive) return;

          const SWIPE_THRESHOLD = width * 0.3;
          const VELOCITY_THRESHOLD = 0.5;

          const shouldSwipe =
            Math.abs(gestureState.dx) > SWIPE_THRESHOLD ||
            Math.abs(gestureState.vx) > VELOCITY_THRESHOLD;

          if (shouldSwipe) {
            const direction = gestureState.dx > 0 ? 1 : -1;
            const directionLabel = direction === 1 ? "right" : "left";

            Animated.parallel([
              Animated.timing(translateX, {
                toValue: width * 1.5 * direction,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(gestureRotation, {
                toValue: direction * 45,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(decisionProgress, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // Call onSwipe after animation completes
              onSwipe({ direction: directionLabel, pokemonId });
              decisionProgress.setValue(0);
              swipeDirectionRef.current = null;
              setSwipeDirection(null);
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            // Reset to proper positions based on index
            if (index === 0) {
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                  toValue: 0,
                  useNativeDriver: true,
                }),
                Animated.spring(gestureRotation, {
                  toValue: 0,
                  useNativeDriver: true,
                }),
                Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
              ]).start();
            } else if (index === 1) {
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 8,
                  useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                  toValue: 8,
                  useNativeDriver: true,
                }),
                Animated.spring(gestureRotation, {
                  toValue: 0,
                  useNativeDriver: true,
                }),
                Animated.spring(opacity, {
                  toValue: 0.9,
                  useNativeDriver: true,
                }),
              ]).start();
            } else if (index === 2) {
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 16,
                  useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                  toValue: 16,
                  useNativeDriver: true,
                }),
                Animated.spring(gestureRotation, {
                  toValue: 0,
                  useNativeDriver: true,
                }),
                Animated.spring(opacity, {
                  toValue: 0.8,
                  useNativeDriver: true,
                }),
              ]).start();
            }

            Animated.timing(decisionProgress, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            swipeDirectionRef.current = null;
            setSwipeDirection(null);
          }
        },
      }),
    [
      isActive,
      index,
      onSwipe,
      gestureRotation,
      opacity,
      translateX,
      translateY,
      decisionProgress,
      setSwipeDirection,
    ]
  );

  // Create animated styles using React Native Animated
  const animatedStyle = {
    transform: [
      { translateX },
      { translateY },
      {
        rotate: gestureRotation.interpolate({
          inputRange: [-45, 45],
          outputRange: ["-45deg", "45deg"],
        }),
      },
      { scale },
    ],
    opacity,
    zIndex: 100 - index * 10,
    elevation: 20 - index * 2,
  };

  const mainType = data?.types?.[0] || "normal";
  const gradientColors =
    PokemonTheme.gradients[mainType as keyof typeof PokemonTheme.gradients] ||
    PokemonTheme.gradients.normal;

  useEffect(() => {
    if (isActive && data?.types?.[0] && onTypeChange) {
      onTypeChange(data.types[0]);
    }
  }, [isActive, data?.types, onTypeChange]);

  if (isLoading || !data) {
    return (
      <Animated.View style={[styles.pokemonCard, animatedStyle]}>
        <LinearGradient
          colors={PokemonTheme.gradients.dark}
          style={styles.cardGradient}
        >
          <BlurView intensity={20} tint="light" style={styles.cardContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </BlurView>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.pokemonCard, animatedStyle]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY: floatAnim || 0 }],
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <HolographicShimmer shimmerAnim={shimmerAnim} />
          <PrismaticLayer shimmerAnim={shimmerAnim} />

          <BlurView intensity={10} tint="light" style={styles.cardContent}>
            {isActive && swipeDirection === "right" ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.decisionBadge,
                  styles.decisionBadgeRight,
                  { opacity: decisionProgress },
                ]}
              >
                <Ionicons
                  name="heart"
                  size={18}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.decisionText}>Add to Party</Text>
              </Animated.View>
            ) : null}

            {isActive && swipeDirection === "left" ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.decisionBadge,
                  styles.decisionBadgeLeft,
                  { opacity: decisionProgress },
                ]}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.decisionText}>Release</Text>
              </Animated.View>
            ) : null}

            <CardFrame />
            <CardHeader data={data} />
            <ArtFrame
              mainType={mainType}
              data={data}
              cardGlowAnim={cardGlowAnim}
            />
            <TypeBadges types={data?.types} />
            <AttackMoves mainType={mainType} data={data} />
            <BottomStats data={data} mainType={mainType} />
            <CardSetInfo data={data} />
            <Text style={styles.copyright}>©2024 Pokémon TCG</Text>
            {isActive && <SwipeHints shimmerAnim={shimmerAnim} />}
          </BlurView>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

function HolographicShimmer({ shimmerAnim }: { shimmerAnim: any }) {
  if (!shimmerAnim) return null;

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          transform: [
            {
              translateX:
                shimmerAnim?.interpolate?.({
                  inputRange: [0, 1],
                  outputRange: [-width * 1.5, width * 1.5],
                }) || 0,
            },
            { rotate: "25deg" },
            { scaleY: 3 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          "transparent",
          "transparent",
          "rgba(255,182,193,0.15)",
          "rgba(255,218,185,0.2)",
          "rgba(255,255,224,0.25)",
          "rgba(144,238,144,0.2)",
          "rgba(173,216,230,0.25)",
          "rgba(221,160,221,0.2)",
          "rgba(255,182,193,0.15)",
          "transparent",
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0, 0.1, 0.25, 0.35, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

function PrismaticLayer({ shimmerAnim }: { shimmerAnim: any }) {
  if (!shimmerAnim) return null;

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          transform: [
            {
              translateX:
                shimmerAnim?.interpolate?.({
                  inputRange: [0, 1],
                  outputRange: [-width * 1.2, width * 1.2],
                }) || 0,
            },
            { rotate: "-15deg" },
            { scaleY: 2.5 },
          ],
          opacity:
            shimmerAnim?.interpolate?.({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.3, 0],
            }) || 0,
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255,0,255,0.1)",
          "rgba(0,255,255,0.1)",
          "rgba(255,255,0,0.1)",
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );
}

function CardFrame() {
  return (
    <View style={styles.cardFrame}>
      <View style={styles.cardFrameInner} />
    </View>
  );
}

function CardHeader({ data }: { data: any | undefined }) {
  if (!data) return null;
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.pokemonNameHeader}>
        {data?.name?.toUpperCase() || "UNKNOWN"}
      </Text>
      <View style={styles.hpContainer}>
        <Text style={styles.hpText}>HP</Text>
        <Text style={styles.hpValue}>
          {Array.isArray(data?.stats)
            ? data.stats.find((s: any) => s?.name === "hp")?.value || 100
            : 100}
        </Text>
      </View>
    </View>
  );
}

function ArtFrame({ mainType, data, cardGlowAnim }: any) {
  if (!data) return null;
  const safeMainType = mainType || "normal";

  return (
    <View style={styles.artFrame}>
      <LinearGradient
        colors={[
          `${getTypeColor(safeMainType)}22`,
          "transparent",
          `${getTypeColor(safeMainType)}11`,
        ]}
        style={styles.artBackground}
      />
      <View style={styles.imageContainer}>
        {data?.image && (
          <Animated.Image
            source={{ uri: data.image }}
            style={[
              styles.pokemonImage,
              {
                transform: [
                  {
                    scale:
                      cardGlowAnim?.interpolate?.({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                      }) || 1,
                  },
                ],
              },
            ]}
            resizeMode="contain"
          />
        )}
        <View style={styles.sparkleContainer}>
          <View style={[styles.sparkle, { top: 5, left: 5 }]} />
          <View style={[styles.sparkle, { top: 20, right: 15 }]} />
          <View style={[styles.sparkle, { bottom: 15, left: 20 }]} />
          <View style={[styles.sparkle, { bottom: 5, right: 5 }]} />
        </View>
      </View>
      <Text style={styles.stageName}>Basic Pokémon</Text>
    </View>
  );
}

function TypeBadges({ types }: { types: string[] | undefined }) {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return (
      <View style={styles.typesContainer}>
        <LinearGradient
          colors={[getTypeColor("normal"), `${getTypeColor("normal")}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.typeBadge}
        >
          <Text style={styles.typeText}>NORMAL</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.typesContainer}>
      {types
        .filter((type) => type)
        .map((type: string) => (
          <LinearGradient
            key={type}
            colors={[getTypeColor(type), `${getTypeColor(type)}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.typeBadge}
          >
            <Text style={styles.typeText}>
              {type?.toUpperCase() || "UNKNOWN"}
            </Text>
          </LinearGradient>
        ))}
    </View>
  );
}

function AttackMoves({ mainType, data }: any) {
  if (!data) return null;
  const safeMainType = mainType || "normal";
  const attackValue = Array.isArray(data?.stats)
    ? data.stats.find((s: any) => s?.name === "attack")?.value || 50
    : 50;

  return (
    <View style={styles.movesContainer}>
      <View style={styles.moveRow}>
        <View style={styles.energyBadge}>
          <View
            style={[
              styles.energyIcon,
              { backgroundColor: getTypeColor(safeMainType) },
            ]}
          />
        </View>
        <Text style={styles.moveName}>Quick Attack</Text>
        <Text style={styles.moveDamage}>{attackValue}</Text>
      </View>
      <View style={styles.moveRow}>
        <View style={styles.energyBadge}>
          <View
            style={[
              styles.energyIcon,
              { backgroundColor: getTypeColor(safeMainType) },
            ]}
          />
          <View
            style={[
              styles.energyIcon,
              { backgroundColor: getTypeColor(safeMainType) },
            ]}
          />
        </View>
        <Text style={styles.moveName}>Special Attack</Text>
        <Text style={styles.moveDamage}>{attackValue * 2}</Text>
      </View>
    </View>
  );
}

function BottomStats({ data, mainType }: any) {
  if (!data) return null;
  const safeMainType = mainType || "normal";
  const secondType = data?.types?.[1] || safeMainType;

  return (
    <View style={styles.bottomStats}>
      <View style={styles.weaknessResistance}>
        <Text style={styles.statMiniLabel}>Weakness</Text>
        <View
          style={[
            styles.typeMini,
            {
              backgroundColor: getTypeColor(secondType),
            },
          ]}
        />
      </View>
      <View style={styles.weaknessResistance}>
        <Text style={styles.statMiniLabel}>Retreat</Text>
        <View style={styles.retreatCost}>
          <Text style={styles.retreatText}>⚪⚪</Text>
        </View>
      </View>
    </View>
  );
}

function CardSetInfo({ data }: { data: any }) {
  if (!data) return null;
  const pokemonId = data?.id || "???";

  return (
    <View style={styles.cardSetInfo}>
      <Text style={styles.cardSetText}>1st Edition</Text>
      <Text style={styles.raritySymbol}>★</Text>
      <Text style={styles.cardNumber}>{pokemonId}/151</Text>
    </View>
  );
}

function SwipeHints({ shimmerAnim }: { shimmerAnim: any }) {
  if (!shimmerAnim) return null;

  return (
    <>
      <Animated.View
        style={[
          styles.swipeHint,
          styles.swipeHintLeft,
          {
            opacity:
              shimmerAnim?.interpolate?.({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.4, 0],
              }) || 0,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.5)" />
      </Animated.View>

      <Animated.View
        style={[
          styles.swipeHint,
          styles.swipeHintRight,
          {
            opacity:
              shimmerAnim?.interpolate?.({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.4, 0],
              }) || 0,
          },
        ]}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color="rgba(255,255,255,0.5)"
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  pokemonCard: {
    position: "absolute",
    width: width - 60,
    height: 430,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 25,
    padding: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  decisionBadge: {
    position: "absolute",
    top: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(10,14,39,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 20,
  },
  decisionBadgeRight: {
    right: 18,
    backgroundColor: "rgba(16,185,129,0.75)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  decisionBadgeLeft: {
    left: 18,
    backgroundColor: "rgba(239,68,68,0.75)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  decisionText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  shimmer: {
    position: "absolute",
    top: -50,
    left: -200,
    right: -200,
    bottom: -50,
    width: 300,
    zIndex: 10,
  },
  shimmerGradient: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    borderRadius: 22,
    padding: 20,
    paddingBottom: 35,
    paddingHorizontal: 15,
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  cardFrame: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 18,
    borderWidth: 6,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  cardFrameInner: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    marginTop: 3,
    marginBottom: 3,
    width: "85%",
    alignSelf: "center",
  },
  pokemonNameHeader: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  hpContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hpText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "rgba(255,100,100,1)",
  },
  hpValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  artFrame: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 6,
    marginHorizontal: 0,
    marginTop: 3,
    marginBottom: 3,
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
  },
  artBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
  },
  stageName: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    marginTop: 5,
    fontStyle: "italic",
  },
  imageContainer: {
    width: 130,
    height: 130,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 3,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  pokemonImage: {
    width: 120,
    height: 120,
  },
  typesContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 0,
    alignSelf: "center",
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    maxWidth: 100,
  },
  typeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  movesContainer: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 0,
    marginBottom: 6,
    gap: 6,
    width: "85%",
    alignSelf: "center",
  },
  moveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  energyBadge: {
    flexDirection: "row",
    gap: 3,
  },
  energyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  moveName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  moveDamage: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    minWidth: 35,
    textAlign: "right",
  },
  bottomStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 0,
    marginBottom: 8,
    marginTop: 3,
    width: "60%",
    alignSelf: "center",
  },
  weaknessResistance: {
    alignItems: "center",
  },
  statMiniLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 3,
  },
  typeMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  retreatCost: {
    flexDirection: "row",
  },
  retreatText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  cardSetInfo: {
    position: "absolute",
    bottom: 15,
    left: 25,
    right: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSetText: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 8,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  raritySymbol: {
    fontSize: 12,
    color: "rgba(255,215,0,0.8)",
  },
  cardNumber: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    fontWeight: "600",
  },
  copyright: {
    position: "absolute",
    bottom: 5,
    alignSelf: "center",
    fontSize: 6,
    color: "rgba(255,255,255,0.3)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "bold",
  },
  swipeHint: {
    position: "absolute",
    top: "45%",
    marginTop: -10,
    zIndex: 20,
  },
  swipeHintLeft: {
    left: 10,
  },
  swipeHintRight: {
    right: 10,
  },
});

export default PokemonCardSwipeable;
