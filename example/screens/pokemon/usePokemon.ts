import { useQuery } from "@tanstack/react-query";

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
    `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
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
};
