import { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Animated,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pokemonNames, searchPokemon } from "./pokemonNames";
import { PokemonCardSwipeable } from "./PokemonCardSwipeable";
import { PokedexTrainerCollection } from "./PokedexTrainerCollection";
import { useSafeAreaInsets } from "@react-buoy/shared-ui/hooks";
import { safeGetItem, safeSetItem } from "@react-buoy/shared-ui";
import { usePokemon } from "./usePokemon";
import { PokemonTheme } from "./constants/PokemonTheme";
import { useRequestMethod } from "./useRequestMethod";

const { width, height } = Dimensions.get("window");

const SAVED_POKEMON_STORAGE_KEY = "@devtools/pokemon/saved";
const SAVED_POKEMON_QUERY_KEY = ["pokemon", "saved"] as const;

// Get random Pokemon from our database
function getRandomPokemonNames(count: number): string[] {
  const shuffled = [...pokemonNames].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function PokemonScreen() {
  const insets = useSafeAreaInsets();

  const [pokemonStack, setPokemonStack] = useState(() => [
    "pikachu",
    "charizard",
    "blastoise",
    "gengar",
    "dragonite",
    "mewtwo",
    "lucario",
    "garchomp",
    "greninja",
    "mimikyu",
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [currentPokemonType, setCurrentPokemonType] =
    useState<string>("electric");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Request method toggle (fetch vs axios)
  const { requestMethod, toggleRequestMethod, isFetch } = useRequestMethod();

  // Auto-scrolling carousel animation
  const scrollX = useRef(new Animated.Value(0)).current;

  const queryClient = useQueryClient();

  const savedPokemonQuery = useQuery<string[]>({
    queryKey: SAVED_POKEMON_QUERY_KEY,
    queryFn: async () => {
      const raw = await safeGetItem(SAVED_POKEMON_STORAGE_KEY);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (name): name is string => typeof name === "string"
          );
        }
      } catch (error) {
        console.warn("Failed to parse saved Pokémon from storage", error);
      }
      return [];
    },
    initialData: [],
    staleTime: 1000 * 10,
  });

  const savePokemonMutation = useMutation<
    { pokemonId: string; savedList: string[] },
    Error,
    string
  >({
    mutationKey: ["pokemon", "save"],
    mutationFn: async (pokemonId: string) => {
      const raw = await safeGetItem(SAVED_POKEMON_STORAGE_KEY);
      let savedList: string[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            savedList = parsed.filter(
              (name): name is string => typeof name === "string"
            );
          }
        } catch (error) {
          console.warn("Failed to parse saved Pokémon list", error);
        }
      }

      const normalized = pokemonId.toLowerCase();
      const uniqueList = [
        normalized,
        ...savedList.filter((name) => name !== normalized),
      ];
      const trimmedList = uniqueList.slice(0, 24);
      await safeSetItem(SAVED_POKEMON_STORAGE_KEY, JSON.stringify(trimmedList));

      return { pokemonId: normalized, savedList: trimmedList };
    },
    onMutate: async (pokemonId) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
    onSuccess: ({ savedList, pokemonId }) => {
      queryClient.setQueryData(SAVED_POKEMON_QUERY_KEY, savedList);
      queryClient.invalidateQueries({ queryKey: SAVED_POKEMON_QUERY_KEY });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {}
      );
    },
  });

  const deletePokemonMutation = useMutation<
    { pokemonId: string; savedList: string[] },
    Error,
    string
  >({
    mutationKey: ["pokemon", "delete"],
    mutationFn: async (pokemonId: string) => {
      const raw = await safeGetItem(SAVED_POKEMON_STORAGE_KEY);
      let savedList: string[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            savedList = parsed.filter(
              (name): name is string => typeof name === "string"
            );
          }
        } catch (error) {
          console.warn("Failed to parse saved Pokémon list", error);
        }
      }

      const normalized = pokemonId.toLowerCase();
      const filteredList = savedList.filter((name) => name !== normalized);
      await safeSetItem(
        SAVED_POKEMON_STORAGE_KEY,
        JSON.stringify(filteredList)
      );

      return { pokemonId: normalized, savedList: filteredList };
    },
    onSuccess: ({ savedList, pokemonId }) => {
      queryClient.setQueryData(SAVED_POKEMON_QUERY_KEY, savedList);
      queryClient.invalidateQueries({ queryKey: SAVED_POKEMON_QUERY_KEY });
    },
    onError: () => {},
  });

  // Only keep essential animations for effects
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardGlowAnim = useRef(new Animated.Value(0)).current;

  // Bubble particles for background effect
  const bubbleAnims = useRef(
    Array(20)
      .fill(0)
      .map(() => ({
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(height + 50),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(Math.random() * 0.6 + 0.3),
        wobble: new Animated.Value(0),
      }))
  ).current;

  useEffect(() => {
    // Floating animation for cards
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

    // Shimmer effect - continuous smooth animation with holographic feel
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

    // Card glow effect
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

    // Animate bubbles with simpler logic
    bubbleAnims.forEach((bubble, index) => {
      const duration = 6000 + Math.random() * 2000;
      const delay = index * 300;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(bubble.y, {
              toValue: -100,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(bubble.opacity, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(bubble.opacity, {
                toValue: 0,
                duration: 1000,
                delay: duration - 2000,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(bubble.y, {
            toValue: height + 50,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Handle search with haptic feedback
  function handleSearch() {
    if (inputValue.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setPokemonStack([inputValue.trim().toLowerCase(), ...pokemonStack]);
      setCurrentIndex(0);
      setInputValue("");

      // Trigger success animation
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }

  // Get random Pokemon with animation feedback
  const getRandomPokemon = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const randomPokemon = getRandomPokemonNames(1)[0];
    setPokemonStack((prev) => [randomPokemon, ...prev]);
    setCurrentIndex(0);

    // Trigger dice roll animation
    Animated.sequence([
      Animated.timing(cardGlowAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardGlowAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardGlowAnim]);

  // Toggle request method with haptic feedback
  const handleToggleRequestMethod = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleRequestMethod();
  }, [toggleRequestMethod]);

  // Refill stack when getting low
  useEffect(() => {
    if (pokemonStack.length - currentIndex < 5) {
      const newPokemon = getRandomPokemonNames(5);
      setPokemonStack((prev) => [...prev, ...newPokemon]);
    }
  }, [currentIndex, pokemonStack.length]);

  // Handle input change with autocomplete
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);

    if (text.length >= 1) {
      const results = searchPokemon(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, []);

  // Select a suggestion
  const selectSuggestion = useCallback(
    (pokemon: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPokemonStack([pokemon, ...pokemonStack]);
      setCurrentIndex(0);
      setInputValue("");
      setShowSuggestions(false);
      setSuggestions([]);
    },
    [pokemonStack]
  );

  const savedPokemon = savedPokemonQuery.data ?? [];
  // Duplicate the array for infinite scroll effect
  const displayPokemon =
    savedPokemon.length > 0
      ? [...savedPokemon, ...savedPokemon, ...savedPokemon]
      : [];

  // Auto-scroll animation for Pokemon collection
  useEffect(() => {
    if (displayPokemon.length > 3) {
      const itemWidth = 84; // 72px circle + 12px margin
      const totalWidth = (displayPokemon.length * itemWidth) / 3; // Divided by 3 for tripled array

      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -totalWidth,
          duration: displayPokemon.length * 2000, // Slower, smoother scroll
          useNativeDriver: true,
        }),
        { resetBeforeIteration: true }
      ).start();
    }
    return () => {
      scrollX.stopAnimation();
    };
  }, [displayPokemon.length, scrollX]);

  return (
    <View style={styles.container}>
      {/* Premium Animated Background */}
      <LinearGradient
        colors={["#0A0E27", "#1a1f3a", "#2d1b69"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Background Orbs */}
      <Animated.View
        style={[
          styles.backgroundOrb,
          styles.orb1,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [-10, 0],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(147,51,234,0.3)", "transparent"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.backgroundOrb,
          styles.orb2,
          {
            transform: [
              {
                translateX: floatAnim.interpolate({
                  inputRange: [-10, 0],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(59,130,246,0.3)", "transparent"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Dynamic colored bubbles based on Pokemon */}
      {bubbleAnims.map((bubble, index) => {
        const getBubbleColor = (type: string, idx: number) => {
          const baseColors = {
            fire: "239, 68, 68",
            water: "59, 130, 246",
            grass: "34, 197, 94",
            electric: "250, 204, 21",
            psychic: "236, 72, 153",
            ice: "165, 243, 252",
            dragon: "147, 51, 234",
            dark: "75, 85, 99",
            fairy: "244, 114, 182",
            normal: "203, 213, 225",
          };
          const rgb =
            baseColors[type as keyof typeof baseColors] || baseColors.normal;
          const opacity = 0.3 + (idx % 3) * 0.05;
          return `rgba(${rgb}, ${opacity})`;
        };

        const color = getBubbleColor(currentPokemonType, index);

        return (
          <Animated.View
            key={`bubble-${index}`}
            style={[
              styles.bubble,
              {
                transform: [
                  { translateX: Animated.add(bubble.x || 0, bubble.wobble) },
                  { translateY: bubble.y },
                  { scale: bubble.scale },
                ],
                opacity: bubble.opacity,
                left: (index * 9) % width,
                backgroundColor: color,
                borderColor: color.replace("0.3", "0.5"),
              },
            ]}
          />
        );
      })}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 30,
          },
        ]}
      >
        {/* === DevTools Filter Buttons Variations Showcase === */}

        {/* <ReactNativeShapesShowcase />
        <IconShowcase /> */}
        {/* <StorageDiffTest /> */}

        {/* Icon Variations Gallery */}
        {/* <IconVariationsGallery /> */}
        {/* <RandomShapeGenerator /> */}
        {/* <UniversalShapeEditor /> */}
        {/* <GearsIconDemo /> */}
        {/* <WifiIconDemo /> */}
        {/* <IconComparison /> */}
        {/* <GearIconComparison /> */}
        {/* <StorageIconShowcase /> */}
        {/* <SentryBugShowcase /> */}
        {/* <ReactQueryShowcase /> */}
        {/* <ReactQueryVariations /> */}
        {/* <ReactQueryExactShowcase /> */}
        {/* <ReactNativeShapesShowcase /> */}
        {/* <ReactLogoShapesShowcase /> */}
        {/* <HexagonShowcase /> */}
        {/* Premium Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              transform: [
                {
                  scale: floatAnim.interpolate({
                    inputRange: [-10, 0],
                    outputRange: [1.02, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,215,0,0.1)", "transparent"]}
            style={styles.headerGlow}
          />
          <View style={styles.titleContainer}>
            <View style={styles.titleBadge}>
              <LinearGradient
                colors={["#FFD700", "#FFA500", "#FF6347"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.titleGradient}
              >
                <Text style={styles.titleSmall}>ULTIMATE</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>POKÉDEX</Text>
            <View style={styles.titleAccent}>
              <Animated.View
                style={[
                  styles.pulsingDot,
                  {
                    opacity: cardGlowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [
                      {
                        scale: cardGlowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.subtitle}>Gotta Catch &apos;Em All!</Text>
        </Animated.View>

        {/* Premium Search Section */}
        <View style={styles.searchSection}>
          <Animated.View
            style={[
              styles.searchContainer,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [-10, 0],
                      outputRange: [-2, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Glowing border effect */}
            <Animated.View
              style={[
                styles.searchGlowBorder,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 0.8, 0.3],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={["#FFD700", "#FF69B4", "#00CED1", "#FFD700"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowGradient}
              />
            </Animated.View>

            <BlurView intensity={40} tint="dark" style={styles.searchBlur}>
              <LinearGradient
                colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
                style={styles.searchGradientOverlay}
              >
                <View style={styles.inputWrapper}>
                  {/* Animated Search Icon */}
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    }}
                  >
                    <Ionicons
                      name="search-circle"
                      size={24}
                      color="rgba(255,215,0,0.7)"
                    />
                  </Animated.View>

                  <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={handleInputChange}
                    placeholder="Name or Number"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    onSubmitEditing={handleSearch}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />

                  {/* Premium Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={handleSearch}
                      activeOpacity={0.7}
                      style={styles.actionButton}
                    >
                      <LinearGradient
                        colors={["#4A90E2", "#357ABD"]}
                        style={styles.gradientButton}
                      >
                        <Ionicons name="search" size={18} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={getRandomPokemon}
                      activeOpacity={0.7}
                      style={styles.actionButton}
                    >
                      <Animated.View
                        style={{
                          transform: [
                            {
                              rotate: cardGlowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "180deg"],
                              }),
                            },
                          ],
                        }}
                      >
                        <LinearGradient
                          colors={["#FFD700", "#FFA500"]}
                          style={styles.gradientButton}
                        >
                          <Ionicons name="dice" size={18} color="#FFFFFF" />
                        </LinearGradient>
                      </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleToggleRequestMethod}
                      activeOpacity={0.7}
                      style={styles.actionButton}
                    >
                      <Animated.View
                        style={{
                          transform: [
                            {
                              rotate: shimmerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                        }}
                      >
                        <LinearGradient
                          colors={
                            isFetch
                              ? ["#4A90E2", "#357ABD"]
                              : ["#9333EA", "#7C3AED"]
                          }
                          style={styles.gradientButton}
                        >
                          <Text style={styles.methodToggleTextCompact}>
                            {isFetch ? "fetch" : "axios"}
                          </Text>
                        </LinearGradient>
                      </Animated.View>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <Animated.View style={styles.suggestionsContainer}>
                <BlurView
                  intensity={30}
                  tint="dark"
                  style={styles.suggestionsBlur}
                >
                  {suggestions.map((pokemon, index) => (
                    <TouchableOpacity
                      key={pokemon}
                      style={[
                        styles.suggestionItem,
                        index === suggestions.length - 1 &&
                          styles.lastSuggestion,
                      ]}
                      onPress={() => selectSuggestion(pokemon)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionContent}>
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color="rgba(255,215,0,0.6)"
                        />
                        <Text style={styles.suggestionText}>
                          {pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="rgba(255,255,255,0.3)"
                      />
                    </TouchableOpacity>
                  ))}
                </BlurView>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* Pokemon Card Stack */}
        <View style={styles.cardStackContainer}>
          <View
            style={{
              width: width - 60,
              height: 430,
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {pokemonStack
              .slice(currentIndex, currentIndex + 3)
              .map((pokemonId, stackIndex) => {
                const actualIndex = currentIndex + stackIndex;
                return (
                  <PokemonCardSwipeable
                    key={`${pokemonId}-${actualIndex}`}
                    pokemonId={pokemonId}
                    index={stackIndex}
                    isActive={stackIndex === 0}
                    onSwipe={({ direction, pokemonId: swipedPokemonId }) => {
                      if (stackIndex === 0) {
                        setCurrentIndex((prev) => prev + 1);
                        // Add a new random Pokemon to the end of the stack
                        const newPokemon = getRandomPokemonNames(1);
                        setPokemonStack((prev) => [...prev, ...newPokemon]);
                      }

                      if (direction === "right") {
                        savePokemonMutation.mutate(swipedPokemonId);
                      } else {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        ).catch(() => {});
                      }
                    }}
                    onTypeChange={setCurrentPokemonType}
                    shimmerAnim={shimmerAnim}
                    floatAnim={floatAnim}
                    cardGlowAnim={cardGlowAnim}
                    requestMethod={requestMethod}
                  />
                );
              })
              .reverse()}
          </View>
        </View>

        {/* Card Stack Indicator */}
        <View style={styles.stackIndicator}>
          {[0, 1, 2].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i === 0 && styles.activeDot,
                i === 0 && {
                  transform: [
                    {
                      scale: cardGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.3],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {/* Pokedex Trainer Collection */}
        <PokedexTrainerCollection
          shimmerAnim={shimmerAnim}
          floatAnim={floatAnim}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 25,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  headerGlow: {
    position: "absolute",
    top: -20,
    left: -50,
    right: -50,
    height: 100,
    opacity: 0.3,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleBadge: {
    marginRight: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  titleGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  titleSmall: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  titleAccent: {
    marginLeft: 10,
    position: "relative",
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,215,0,0.6)",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  title: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 3,
    textShadowColor: "#FF6347",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 15,
  },
  searchSection: {
    marginHorizontal: 15,
    marginBottom: 20,
    zIndex: 9998,
  },
  searchContainer: {
    position: "relative",
    zIndex: 9999,
  },
  searchGlowBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    zIndex: -1,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 26,
  },
  searchGradientOverlay: {
    flex: 1,
    borderRadius: 24,
  },
  searchBlur: {
    height: 52,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(20,20,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  methodToggleTextCompact: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  stackIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 15,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  cardStackContainer: {
    height: 460,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 0,
    zIndex: 1,
  },
  bubble: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  actionToast: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 10000,
  },
  toastGradient: {
    borderRadius: 20,
    overflow: "hidden",
  },
  toastBlur: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(10, 10, 30, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  toastTextBlock: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  toastSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(226,232,255,0.8)",
    letterSpacing: 0.3,
  },
  trainerLogSection: {
    marginHorizontal: 18,
    marginTop: 8,
  },
  trainerLogGradient: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
  },
  trainerLogBlur: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(10, 12, 30, 0.75)",
    gap: 14,
  },
  trainerLogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trainerLogTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trainerLogIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
  },
  trainerLogTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  trainerLogCount: {
    fontSize: 12,
    color: "rgba(226,232,255,0.7)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  trainerLogStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mutationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mutationBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mutationBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  trainerSpinner: {
    marginLeft: 4,
  },
  trainerChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trainerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  trainerChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.6,
  },
  trainerEmptyText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontStyle: "italic",
    color: "rgba(226,232,255,0.7)",
  },
  trainerMoreText: {
    fontSize: 12,
    color: "rgba(148,163,184,0.85)",
    marginTop: -4,
    letterSpacing: 0.6,
  },
  trainerErrorText: {
    fontSize: 12,
    color: "rgba(252,165,165,0.95)",
    letterSpacing: 0.5,
  },
  backgroundOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  orb1: {
    top: -100,
    left: -100,
  },
  orb2: {
    bottom: -100,
    right: -100,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 150,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    zIndex: 10000,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 100,
  },
  suggestionsBlur: {
    backgroundColor: "rgba(20,20,40,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    borderRadius: 16,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  lastSuggestion: {
    borderBottomWidth: 0,
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  suggestionText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // New Pokedex Styles
  pokedexContainer: {
    marginHorizontal: 15,
    marginTop: 10,
  },
  pokedexGradient: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,15,40,0.4)",
  },
  pokedexBlur: {
    padding: 20,
    borderRadius: 26,
  },
  pokedexHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pokedexTitleSection: {
    flex: 1,
    alignItems: "center",
  },
  pokedexHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pokedexHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pokeballContainer: {
    width: 36,
    height: 36,
    position: "relative",
  },
  pokeballTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  pokeballBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  pokeballCenter: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  pokeballButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#000",
  },
  pokedexTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 2,
    textShadowColor: "rgba(255,215,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pokedexSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  countBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  carouselContainer: {
    height: 100,
    marginHorizontal: -20,
    marginBottom: 12,
    overflow: "hidden",
  },
  carouselMask: {
    flex: 1,
    position: "relative",
  },
  carouselTrack: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: "100%",
  },
  carouselFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  // Circular Pokemon entries
  pokemonCircle: {
    width: 72,
    height: 72,
    marginRight: 12,
    position: "relative",
  },
  circleGlowBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 39,
    zIndex: -1,
  },
  glowBorderGradient: {
    flex: 1,
    borderRadius: 39,
  },
  circleGlowRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 44,
    zIndex: -1,
  },
  circleGlowGradient: {
    flex: 1,
    borderRadius: 44,
  },
  circleGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circleContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  circleShimmer: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 46,
  },
  shimmerInner: {
    flex: 1,
    borderRadius: 46,
  },
  circleImage: {
    width: 56,
    height: 56,
    zIndex: 1,
  },
  miniPokeball: {
    width: 32,
    height: 32,
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  miniPokeballHalf: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 16,
  },
  miniPokeballBottom: {
    bottom: 0,
  },
  miniPokeballCenter: {
    position: "absolute",
    top: 13,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  miniPokeballButton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
  },
  emptyStateContainer: {
    width: width - 80,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateBg: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.2)",
    borderStyle: "dashed",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,215,0,0.7)",
    letterSpacing: 0.5,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  scrollIndicatorText: {
    fontSize: 11,
    color: "rgba(255,215,0,0.5)",
    letterSpacing: 0.5,
    fontStyle: "italic",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  errorText: {
    fontSize: 12,
    color: "#FF6B6B",
    letterSpacing: 0.3,
  },
});
