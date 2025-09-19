import { useQuery } from "@tanstack/react-query";

// Expanded interface with more useful Pokemon data
interface PokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  image: string | null; // Main image
  types: string[]; // Pokemon types (e.g., fire, water)
  stats: {
    name: string;
    value: number;
  }[];
}

const fetchPokemon = async (pokemonName: string): Promise<PokemonData> => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();

  // Create a more detailed but still clean data object
  return {
    id: data.id,
    name: data.name,
    height: data.height / 10, // Convert to meters
    weight: data.weight / 10, // Convert to kg
    image:
      data.sprites.other["official-artwork"].front_default ||
      data.sprites.front_default,
    types: data.types.map((t: any) => t.type.name),
    stats: data.stats.map((s: any) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
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
};
