const { Snack } = require('snack-sdk');

// Create a simplified version of your app for Snack
const createSnack = async () => {
  console.log('Creating Snack...');

  // Simplified Pokemon fetching without workspace dependencies
  const usePokemonCode = `import { useQuery } from "@tanstack/react-query";

// Slimmed down interface with only the fields actually used in UI
interface PokemonData {
  id: number;
  name: string;
  image: string | null;
  types: string[];
  stats: {
    hp: number;
    attack: number;
  };
}

const fetchPokemon = async (pokemonName: string): Promise<PokemonData> => {
  const response = await fetch(
    \`https://pokeapi.co/api/v2/pokemon/\${pokemonName}\`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();

  // Extract only the stats we actually use (hp and attack)
  const hpStat = data.stats.find((s: any) => s.stat.name === "hp");
  const attackStat = data.stats.find((s: any) => s.stat.name === "attack");

  // Return a slim data object with only the fields we use in the UI
  return {
    id: data.id,
    name: data.name,
    image:
      data.sprites.other["official-artwork"].front_default ||
      data.sprites.front_default,
    types: data.types.map((t: any) => t.type.name),
    stats: {
      hp: hpStat?.base_stat || 100,
      attack: attackStat?.base_stat || 50,
    },
  };
};

export const usePokemon = (pokemonName: string) => {
  return useQuery({
    queryKey: ["pokemon", pokemonName],
    queryFn: () => fetchPokemon(pokemonName),
    enabled: pokemonName.length > 0,
    // Keep data in cache longer
    gcTime: 1000 * 60 * 10, // 10 minutes
    staleTime: 1000 * 60 * 2, // 2 minutes
    // Don't refetch on reconnect/focus during development
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};`;

  // Simplified Pokemon names (partial list for Snack)
  const pokemonNamesCode = `export const pokemonNames = [
  "pikachu", "charizard", "blastoise", "venusaur", "gengar", "dragonite",
  "mewtwo", "lucario", "garchomp", "greninja", "mimikyu", "eevee",
  "jigglypuff", "psyduck", "snorlax", "magikarp", "gyarados", "alakazam",
  "machamp", "golem", "rapidash", "slowpoke", "magnezone", "hitmonlee"
];

export function searchPokemon(query: string): string[] {
  if (!query) return [];
  const lowercaseQuery = query.toLowerCase();
  return pokemonNames
    .filter(name => name.includes(lowercaseQuery))
    .slice(0, 8);
}`;

  // Simplified App.tsx without workspace dependencies
  const appCode = `import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image } from "react-native";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePokemon } from "./usePokemon";
import { searchPokemon } from "./pokemonNames";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const queryClient = new QueryClient();

function PokemonCard({ pokemonName }: { pokemonName: string }) {
  const { data: pokemon, isLoading, error } = usePokemon(pokemonName);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Pokemon not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.cardGradient}
      >
        <Text style={styles.pokemonName}>{pokemon.name.toUpperCase()}</Text>
        {pokemon.image && (
          <Image source={{ uri: pokemon.image }} style={styles.pokemonImage} />
        )}
        <View style={styles.stats}>
          <Text style={styles.statText}>HP: {pokemon.stats.hp}</Text>
          <Text style={styles.statText}>Attack: {pokemon.stats.attack}</Text>
        </View>
        <View style={styles.types}>
          {pokemon.types.map((type, index) => (
            <View key={index} style={styles.typeChip}>
              <Text style={styles.typeText}>{type}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function PokemonApp() {
  const [searchQuery, setSearchQuery] = useState("pikachu");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const results = searchPokemon(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.title}>🔥 POKÉDEX 🔥</Text>
        <Text style={styles.subtitle}>Gotta Catch 'Em All!</Text>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search Pokemon..."
            placeholderTextColor="#999"
          />
        </View>

        {showSuggestions && (
          <View style={styles.suggestions}>
            {suggestions.map((pokemon, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestion}
                onPress={() => {
                  setSearchQuery(pokemon);
                  setShowSuggestions(false);
                }}
              >
                <Text style={styles.suggestionText}>
                  {pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <PokemonCard pokemonName={searchQuery} />
    </ScrollView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.appContainer}>
        <PokemonApp />
        <StatusBar style="light" />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#f0f2ff",
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 40,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 5,
    fontStyle: "italic",
  },
  searchSection: {
    margin: 20,
    position: "relative",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  suggestions: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  card: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 25,
    alignItems: "center",
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    letterSpacing: 2,
  },
  pokemonImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  statText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  types: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  typeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    padding: 40,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "#ff6b6b",
    padding: 40,
  },
});`;

  const snack = new Snack({
    name: 'Pokemon Dex - React Native Example',
    description: 'A beautiful Pokemon search app built with React Native and Expo',
    files: {
      'App.tsx': {
        type: 'CODE',
        contents: appCode,
      },
      'usePokemon.ts': {
        type: 'CODE',
        contents: usePokemonCode,
      },
      'pokemonNames.ts': {
        type: 'CODE',
        contents: pokemonNamesCode,
      }
    },
    dependencies: {
      '@tanstack/react-query': { version: '5.89.0' },
      'expo-linear-gradient': { version: '15.0.7' },
      'expo-status-bar': { version: '3.0.8' },
      'react': { version: '19.1.0' },
      'react-native': { version: '0.81.4' }
    },
    sdkVersion: '54.0.0'
  });

  console.log('Making Snack online...');
  snack.setOnline(true);

  console.log('Saving Snack...');
  const result = await snack.saveAsync();

  console.log('\n🎉 Success! Your Snack is ready:');
  console.log('📱 Snack URL:', result.url);
  console.log('🌐 Web Preview:', `https://snack.expo.dev/${result.id}`);
  console.log('\n📋 Share this link with others to let them test your app!');

  return result;
};

// Run the script
createSnack().catch(console.error);