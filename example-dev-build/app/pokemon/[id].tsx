import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "@react-buoy/shared-ui/hooks";
import { usePokemonDetail } from "../../screens/pokemon/usePokemonDetail";
import { useRequestMethod } from "../../screens/pokemon/useRequestMethod";
import { useRef, useEffect } from "react";
import { PokemonTheme } from "../../screens/pokemon/constants/PokemonTheme";
import { getTypeColor } from "../../screens/pokemon/pokemonTypeColors";

export default function PokemonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestMethod } = useRequestMethod();

  // Fetch Pokemon data
  const { data: pokemon, isLoading, error } = usePokemonDetail(id || "", requestMethod);

  // Animations - same as home screen
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cardGlowAnim = useRef(new Animated.Value(0)).current;
  const backButtonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer effect - matching home screen
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Card glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(cardGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Back button glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(backButtonGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonGlow, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0A0E27", "#1a1f3a", "#2d1b69"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Pokemon...</Text>
        </View>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0A0E27", "#1a1f3a", "#2d1b69"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Pokemon not found</Text>
          </View>
        </View>
      </View>
    );
  }

  const primaryType = pokemon.types[0]?.type.name || "normal";
  const typeColors =
    PokemonTheme.gradients[primaryType as keyof typeof PokemonTheme.gradients] ||
    PokemonTheme.gradients.normal;

  // Transform data to match home screen format
  const cardData = {
    name: pokemon.name,
    id: pokemon.id,
    image:
      pokemon.sprites?.other?.["official-artwork"]?.front_default ||
      pokemon.sprites?.front_default,
    types: pokemon.types.map((t) => t.type.name),
    stats: {
      hp: pokemon.stats.find((s) => s.stat.name === "hp")?.base_stat || 100,
      attack: pokemon.stats.find((s) => s.stat.name === "attack")?.base_stat || 50,
    },
  };

  return (
    <View style={styles.container}>
      {/* Premium Animated Background - same as home */}
      <LinearGradient
        colors={["#0A0E27", "#1a1f3a", "#2d1b69"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={styles.backButtonContainer}
        >
          <Animated.View
            style={[
              styles.backButtonGlowBorder,
              {
                opacity: backButtonGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF6347", "#FFD700"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backButtonGlowGradient}
            />
          </Animated.View>
          <BlurView intensity={60} tint="dark" style={styles.backButton}>
            <LinearGradient
              colors={["rgba(255,215,0,0.3)", "rgba(255,165,0,0.2)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backButtonInner}
            >
              <Ionicons name="chevron-back" size={22} color="#FFD700" />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        {/* Card with exact same styling as home screen - just taller */}
        <Animated.View
          style={[
            styles.pokemonCard,
            {
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={typeColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Holographic Shimmer - same as home */}
            <HolographicShimmer shimmerAnim={shimmerAnim} />
            <PrismaticLayer shimmerAnim={shimmerAnim} />

            <BlurView intensity={10} tint="light" style={styles.cardContent}>
              {/* Exact same card components as home screen */}
              <CardFrame />
              <CardHeader data={cardData} />
              <ArtFrame
                mainType={primaryType}
                data={cardData}
                cardGlowAnim={cardGlowAnim}
              />
              <TypeBadges types={cardData.types} />
              <AttackMoves mainType={primaryType} data={cardData} />
              <BottomStats data={cardData} mainType={primaryType} />

              {/* Additional detail info (scrollable) */}
              <View style={styles.detailInfo}>
                {/* All Stats */}
                <View style={styles.allStatsContainer}>
                  <Text style={styles.detailSectionTitle}>Stats</Text>
                  {pokemon.stats.map((statInfo) => (
                    <View key={statInfo.stat.name} style={styles.statRow}>
                      <Text style={styles.statName}>
                        {statInfo.stat.name
                          .replace("-", " ")
                          .split(" ")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </Text>
                      <Text style={styles.statValue}>{statInfo.base_stat}</Text>
                    </View>
                  ))}
                </View>

                {/* Abilities */}
                <View style={styles.abilitiesSection}>
                  <Text style={styles.detailSectionTitle}>Abilities</Text>
                  <View style={styles.abilitiesList}>
                    {pokemon.abilities.map((abilityInfo) => (
                      <View
                        key={abilityInfo.ability.name}
                        style={styles.abilityChip}
                      >
                        <Text style={styles.abilityText}>
                          {abilityInfo.ability.name
                            .replace("-", " ")
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </Text>
                        {abilityInfo.is_hidden && (
                          <Text style={styles.hiddenText}> (Hidden)</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Measurements */}
                <View style={styles.measurementsRow}>
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>Height</Text>
                    <Text style={styles.measurementValue}>
                      {(pokemon.height / 10).toFixed(1)}m
                    </Text>
                  </View>
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>Weight</Text>
                    <Text style={styles.measurementValue}>
                      {(pokemon.weight / 10).toFixed(1)}kg
                    </Text>
                  </View>
                </View>
              </View>

              <CardSetInfo data={cardData} />
              <Text style={styles.copyright}>©2024 Pokémon TCG</Text>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ===== REUSED COMPONENTS FROM HOME SCREEN =====

function HolographicShimmer({ shimmerAnim }: { shimmerAnim: any }) {
  if (!shimmerAnim) return null;

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          transform: [
            {
              translateX: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-400, 400],
              }),
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
              translateX: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-400, 400],
              }),
            },
            { rotate: "-20deg" },
            { scaleY: 2 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255,100,100,0.05)",
          "rgba(100,255,100,0.08)",
          "rgba(100,100,255,0.1)",
          "rgba(255,255,100,0.08)",
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
        <Text style={styles.hpValue}>{data?.stats?.hp || 100}</Text>
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
            <Text style={styles.typeText}>{type?.toUpperCase() || "UNKNOWN"}</Text>
          </LinearGradient>
        ))}
    </View>
  );
}

function AttackMoves({ mainType, data }: any) {
  if (!data) return null;
  const safeMainType = mainType || "normal";
  const attackValue = data?.stats?.attack || 50;

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

// ===== STYLES (EXACT COPY FROM HOME SCREEN) =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "600",
  },
  backButtonContainer: {
    marginBottom: 20,
    alignSelf: "flex-start",
    position: "relative",
  },
  backButtonGlowBorder: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 20,
    zIndex: 0,
  },
  backButtonGlowGradient: {
    flex: 1,
    borderRadius: 20,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.5)",
    zIndex: 1,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pokemonCard: {
    width: "100%",
    minHeight: 700,
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 40,
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
  cardContent: {
    flex: 1,
    borderRadius: 21,
    padding: 12,
  },
  shimmer: {
    position: "absolute",
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
  },
  cardFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
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
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
  },
  raritySymbol: {
    fontSize: 12,
    color: "#FFD700",
  },
  cardNumber: {
    fontSize: 8,
    color: "rgba(255,255,255,0.4)",
  },
  copyright: {
    position: "absolute",
    bottom: 5,
    alignSelf: "center",
    fontSize: 6,
    color: "rgba(255,255,255,0.3)",
  },
  // Additional detail sections
  detailInfo: {
    marginTop: 10,
    gap: 10,
    width: "85%",
    alignSelf: "center",
    marginBottom: 30,
  },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 5,
    letterSpacing: 1,
  },
  allStatsContainer: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  statName: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  abilitiesSection: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
  },
  abilitiesList: {
    gap: 5,
  },
  abilityChip: {
    flexDirection: "row",
    alignItems: "center",
  },
  abilityText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  hiddenText: {
    fontSize: 9,
    color: "rgba(255,215,0,0.8)",
    fontStyle: "italic",
  },
  measurementsRow: {
    flexDirection: "row",
    gap: 8,
  },
  measurementItem: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    fontWeight: "600",
  },
});
