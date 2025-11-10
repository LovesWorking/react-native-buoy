import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { safeGetItem, safeSetItem } from "@react-buoy/shared-ui";
import { usePokemon } from "./usePokemon";
import { PokemonTheme } from "./constants/PokemonTheme";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const SAVED_POKEMON_STORAGE_KEY = "@devtools/pokemon/saved";
const SAVED_POKEMON_QUERY_KEY = ["pokemon", "saved"] as const;

function normalizePokemonId(name: string): string {
  return name?.trim().toLowerCase() ?? "";
}

function dedupeAndNormalizePokemon(list: unknown): string[] {
  if (!Array.isArray(list)) {
    return [];
  }

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const entry of list) {
    if (typeof entry !== "string") continue;
    const normalized = normalizePokemonId(entry);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    cleaned.push(normalized);
  }

  return cleaned;
}

interface PokemonLogEntryProps {
  pokemonName: string;
  index: number;
  shimmerAnim: Animated.Value;
  floatAnim: Animated.Value;
  isDeleteMode: boolean;
  isDeleting: boolean;
  onEnterDeleteMode: (pokemonName: string) => void;
  onCancelDeleteMode: () => void;
  onConfirmDelete: (pokemonName: string) => void;
  onNavigate: (pokemonName: string) => void;
}

function PokemonLogEntry({
  pokemonName,
  index,
  shimmerAnim,
  floatAnim,
  isDeleteMode,
  isDeleting,
  onEnterDeleteMode,
  onCancelDeleteMode,
  onConfirmDelete,
  onNavigate,
}: PokemonLogEntryProps) {
  const { data, isLoading } = usePokemon(pokemonName);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const deleteAnim = useRef(new Animated.Value(1)).current;
  const deleteIconAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const hasAnimatedInRef = useRef(false);
  const deleteModeRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedInRef.current) return;
    hasAnimatedInRef.current = true;
    Animated.sequence([
      Animated.delay(index * 80),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, [index, scaleAnim]);

  useEffect(() => {
    if (isDeleting) {
      return;
    }
    if (isDeleteMode) {
      if (!deleteModeRef.current) {
        deleteModeRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Animated.parallel([
        Animated.spring(deleteIconAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 5,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      deleteModeRef.current = false;
      Animated.parallel([
        Animated.spring(deleteIconAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDeleteMode, isDeleting, deleteIconAnim, rotateAnim]);

  useEffect(() => {
    if (isDeleting) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(deleteAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 10,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      deleteAnim.setValue(1);
      if (!hasAnimatedInRef.current) {
        return;
      }
      scaleAnim.setValue(1);
      if (!isDeleteMode) {
        rotateAnim.setValue(0);
      }
    }
  }, [isDeleting, deleteAnim, rotateAnim, scaleAnim, isDeleteMode]);

  const handlePress = () => {
    if (isDeleting) {
      return;
    }

    if (isDeleteMode) {
      onConfirmDelete(pokemonName);
    } else {
      // Navigate to Pokemon detail page
      onNavigate(pokemonName);
    }
  };

  const handleLongPress = () => {
    if (isDeleting) {
      return;
    }

    if (isDeleteMode) {
      onCancelDeleteMode();
    } else {
      onEnterDeleteMode(pokemonName);
    }
  };

  const mainType = data?.types?.[0] || "normal";
  const typeColors =
    PokemonTheme.gradients[mainType as keyof typeof PokemonTheme.gradients] ||
    PokemonTheme.gradients.normal;

  const primaryColor = typeColors[0] ?? "#FFD700";
  const secondaryColor = typeColors[1] ?? primaryColor;
  const tertiaryColor = typeColors[2] ?? "#FFD700";

  const borderColors = [
    primaryColor,
    secondaryColor,
    tertiaryColor,
    primaryColor,
  ] as const;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.pokemonCircle,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, deleteAnim) },
              {
                translateY:
                  floatAnim?.interpolate?.({
                    inputRange: [-10, 0],
                    outputRange: [-3, 0],
                  }) || 0,
              },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1, 10],
                  outputRange: ["0deg", "5deg", "360deg"],
                }),
              },
            ],
            opacity: deleteAnim,
          },
        ]}
      >
        {/* Animated RGB Border like search input */}
        <Animated.View
          style={[
            styles.circleGlowBorder,
            {
              opacity:
                shimmerAnim?.interpolate?.({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.8, 0.3],
                }) || 0.5,
            },
          ]}
        >
          <LinearGradient
            colors={borderColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowBorderGradient}
          />
        </Animated.View>

        {/* Main circle */}
        <LinearGradient
          colors={typeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.circleGradient}
        >
          {/* Pokemon Image with delete overlay */}
          <View style={styles.circleContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
            ) : data?.image ? (
              <Animated.Image
                source={{ uri: data.image }}
                style={[
                  styles.circleImage,
                  {
                    opacity: deleteIconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.3],
                    }),
                  },
                ]}
                resizeMode="contain"
              />
            ) : (
              // Pokeball fallback
              <Animated.View
                style={[
                  styles.miniPokeball,
                  {
                    opacity: deleteIconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.3],
                    }),
                  },
                ]}
              >
                <View
                  style={[
                    styles.miniPokeballHalf,
                    { backgroundColor: "#FF0000" },
                  ]}
                />
                <View style={styles.miniPokeballCenter}>
                  <View style={styles.miniPokeballButton} />
                </View>
                <View
                  style={[
                    styles.miniPokeballHalf,
                    styles.miniPokeballBottom,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                />
              </Animated.View>
            )}

            {/* Delete Icon Overlay */}
            <Animated.View
              style={[
                styles.deleteOverlay,
                {
                  opacity: deleteIconAnim,
                  transform: [
                    {
                      scale: deleteIconAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.deleteIconContainer}>
                <Ionicons name="trash" size={24} color="#FFFFFF" />
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface PokedexTrainerCollectionProps {
  shimmerAnim: Animated.Value;
  floatAnim: Animated.Value;
}

export function PokedexTrainerCollection({
  shimmerAnim,
  floatAnim,
}: PokedexTrainerCollectionProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [deletingPokemonId, setDeletingPokemonId] = useState<string | null>(
    null
  );
  const [mutationError, setMutationError] = useState<string | null>(null);

  const savedPokemonQuery = useQuery<string[]>({
    queryKey: SAVED_POKEMON_QUERY_KEY,
    queryFn: async () => {
      const raw = await safeGetItem(SAVED_POKEMON_STORAGE_KEY);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        const cleaned = dedupeAndNormalizePokemon(parsed);
        if (Array.isArray(parsed) && parsed.length !== cleaned.length) {
          await safeSetItem(SAVED_POKEMON_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (error) {
        // Failed to parse saved Pokémon from storage
      }
      return [];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const deletePokemonMutation = useMutation<
    { pokemonId: string; savedList: string[] },
    Error,
    string,
    { previousSaved: string[] }
  >({
    mutationKey: ["pokemon", "delete"],
    mutationFn: async (pokemonId: string) => {
      const raw = await safeGetItem(SAVED_POKEMON_STORAGE_KEY);
      let savedList: string[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          savedList = dedupeAndNormalizePokemon(parsed);
        } catch (error) {
          // Failed to parse saved Pokémon list
        }
      }

      const normalized = normalizePokemonId(pokemonId);
      const filteredList = savedList.filter((name) => name !== normalized);
      await safeSetItem(
        SAVED_POKEMON_STORAGE_KEY,
        JSON.stringify(filteredList)
      );

      return { pokemonId: normalized, savedList: filteredList };
    },
    onMutate: async (pokemonId) => {
      setMutationError(null);
      const normalized = normalizePokemonId(pokemonId);
      await queryClient.cancelQueries({ queryKey: SAVED_POKEMON_QUERY_KEY });
      const previousSaved =
        queryClient.getQueryData<string[]>(SAVED_POKEMON_QUERY_KEY) ?? [];
      const optimisticList = previousSaved.filter(
        (name) => name !== normalized
      );
      queryClient.setQueryData(SAVED_POKEMON_QUERY_KEY, optimisticList);

      return { previousSaved };
    },
    onSuccess: ({ savedList }) => {
      queryClient.setQueryData(SAVED_POKEMON_QUERY_KEY, savedList);
    },
    onError: (error, _pokemonId, context) => {
      console.error("Could not release Pokémon:", error);
      if (context?.previousSaved) {
        queryClient.setQueryData(
          SAVED_POKEMON_QUERY_KEY,
          context.previousSaved
        );
      }
      setMutationError(
        error?.message || "We couldn't release that Pokémon. Please try again."
      );
    },
    onSettled: () => {
      setDeletingPokemonId(null);
      setActiveDeleteId(null);
      queryClient.invalidateQueries({ queryKey: SAVED_POKEMON_QUERY_KEY });
    },
  });

  const savedPokemon = savedPokemonQuery.data ?? [];

  // Force refetch on mount to ensure we have the latest data
  useEffect(() => {
    savedPokemonQuery.refetch();
  }, []);

  const handleEnterDeleteMode = useCallback(
    (pokemonId: string) => {
      if (deletingPokemonId) {
        return;
      }

      const normalized = normalizePokemonId(pokemonId);
      if (!normalized) {
        return;
      }

      setMutationError(null);
      setActiveDeleteId(normalized);
    },
    [deletingPokemonId]
  );

  const handleConfirmDelete = useCallback(
    (pokemonId: string) => {
      const normalized = normalizePokemonId(pokemonId);
      if (!normalized) {
        return;
      }

      setMutationError(null);
      setDeletingPokemonId(normalized);
      deletePokemonMutation.mutate(normalized);
    },
    [deletePokemonMutation]
  );

  const handleCancelDeleteMode = useCallback(() => {
    if (deletingPokemonId) {
      return;
    }
    setActiveDeleteId(null);
  }, [deletingPokemonId]);

  const handleNavigate = useCallback((pokemonName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/pokemon/${pokemonName}`);
  }, [router]);

  const keyExtractor = useCallback((item: string) => item, []);

  const renderPokemonItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <PokemonLogEntry
        pokemonName={item}
        index={index}
        shimmerAnim={shimmerAnim}
        floatAnim={floatAnim}
        isDeleteMode={activeDeleteId === item && deletingPokemonId !== item}
        isDeleting={deletingPokemonId === item}
        onEnterDeleteMode={handleEnterDeleteMode}
        onCancelDeleteMode={handleCancelDeleteMode}
        onConfirmDelete={handleConfirmDelete}
        onNavigate={handleNavigate}
      />
    ),
    [
      shimmerAnim,
      floatAnim,
      activeDeleteId,
      deletingPokemonId,
      handleEnterDeleteMode,
      handleCancelDeleteMode,
      handleConfirmDelete,
      handleNavigate,
    ]
  );

  useEffect(() => {
    if (activeDeleteId && !savedPokemon.includes(activeDeleteId)) {
      setActiveDeleteId(null);
    }
    if (deletingPokemonId && !savedPokemon.includes(deletingPokemonId)) {
      setDeletingPokemonId(null);
    }
  }, [activeDeleteId, deletingPokemonId, savedPokemon]);

  const carouselContentStyle = useMemo(
    () => [
      styles.carouselTrack,
      savedPokemon.length <= 3 ? styles.carouselTrackCentered : null,
    ],
    [savedPokemon.length]
  );

  return (
    <View style={styles.trainerLogSection}>
      {/* Clean Pokedex Container */}
      <View style={styles.pokedexContainer}>
        <LinearGradient
          colors={[
            "rgba(10,15,40,0.95)",
            "rgba(30,25,80,0.9)",
            "rgba(50,20,100,0.85)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pokedexGradient}
        >
          <BlurView intensity={30} tint="dark" style={styles.pokedexBlur}>
            {/* Simplified Header */}
            <View style={styles.pokedexHeader}>
              {/* Animated Pokeball Icon */}
              <Animated.View
                style={[
                  styles.pokeballContainer,
                  {
                    transform: [
                      {
                        rotate: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.pokeballShadow} />
                <View style={styles.pokeballShell}>
                  <View style={styles.pokeballTopHalf}>
                    <LinearGradient
                      colors={["#FF5F57", "#EE1515"]}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 0.8, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                  <View style={styles.pokeballBottomHalf}>
                    <LinearGradient
                      colors={["#FFFFFF", "#E8E8E8"]}
                      start={{ x: 0.3, y: 0 }}
                      end={{ x: 0.7, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </View>
                  <LinearGradient
                    colors={["rgba(255,255,255,0.6)", "transparent"]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 0.8 }}
                    style={styles.pokeballHighlight}
                  />
                  <View style={styles.pokeballBand} />
                  <View style={styles.pokeballButtonOuter}>
                    <LinearGradient
                      colors={["#F4F4F4", "#D4D4D4"]}
                      start={{ x: 0.3, y: 0 }}
                      end={{ x: 0.7, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.pokeballButtonInner}>
                      <LinearGradient
                        colors={["#FFFFFF", "#D0D7FF"]}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>

              <View style={styles.pokedexTitleSection}>
                <Text style={styles.pokedexTitle}>POKÉDEX</Text>
                <Text style={styles.pokedexSubtitle}>Trainer Collection</Text>
              </View>

              <LinearGradient
                colors={["#FFD700", "#FFA500", "#FF6347"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.countBadge}
              >
                <Text style={styles.countNumber}>{savedPokemon.length}</Text>
              </LinearGradient>
            </View>

            {/* Pokemon Collection Carousel */}
            <View style={styles.carouselContainer}>
              {savedPokemon.length ? (
                <View style={styles.carouselMask}>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={savedPokemon}
                    keyExtractor={keyExtractor}
                    renderItem={renderPokemonItem}
                    contentContainerStyle={carouselContentStyle}
                    extraData={{
                      activeDeleteId,
                      deletingPokemonId,
                    }}
                  />

                  {/* Gradient fade edges */}
                  <LinearGradient
                    colors={[
                      "rgba(10,15,40,1)",
                      "rgba(10,15,40,0)",
                      "rgba(10,15,40,0)",
                      "rgba(10,15,40,1)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.carouselFade}
                    pointerEvents="none"
                  />
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <LinearGradient
                    colors={["rgba(255,215,0,0.1)", "rgba(255,255,255,0.05)"]}
                    style={styles.emptyStateBg}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={48}
                      color="rgba(255,215,0,0.4)"
                    />
                    <Text style={styles.emptyStateText}>
                      Your collection awaits!
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Swipe right to catch Pokémon
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {mutationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{mutationError}</Text>
              </View>
            )}
          </BlurView>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trainerLogSection: {
    marginHorizontal: 15,
    marginTop: 10,
    paddingBottom: 24,
  },
  pokedexContainer: {
    marginHorizontal: 0,
    marginTop: 0,
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
    borderRadius: 24,
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
  pokeballContainer: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  pokeballShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.4,
    borderColor: "rgba(17,24,39,0.45)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  pokeballTopHalf: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    overflow: "hidden",
  },
  pokeballBottomHalf: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "52%",
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    overflow: "hidden",
  },
  pokeballHighlight: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 18,
    height: 10,
    borderRadius: 12,
    opacity: 0.55,
    transform: [{ rotate: "-28deg" }],
  },
  pokeballBand: {
    position: "absolute",
    left: -2,
    right: -2,
    top: "50%",
    height: 5,
    marginTop: -2.5,
    backgroundColor: "rgba(17,24,39,0.8)",
    shadowColor: "rgba(0,0,0,0.35)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 2,
  },
  pokeballButtonOuter: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: "rgba(17,24,39,0.75)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#F4F4F4",
  },
  pokeballButtonInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  pokeballShadow: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.18)",
    opacity: 0.4,
    transform: [{ scaleY: 1.05 }],
    zIndex: -1,
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
  countBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#FDBA74",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  countNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 1,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carouselContainer: {
    height: 110,
    marginHorizontal: -20,
    marginBottom: 12,
    overflow: "visible",
  },
  carouselMask: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselTrack: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  carouselTrackCentered: {
    justifyContent: "center",
  },
  carouselFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
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
    zIndex: 0,
    pointerEvents: "none",
  },
  glowBorderGradient: {
    flex: 1,
    borderRadius: 39,
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
    zIndex: 1,
  },
  circleContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
  emptyStateContainer: {
    width: width - 80,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    paddingBottom: 8,
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
    paddingHorizontal: 24,
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
