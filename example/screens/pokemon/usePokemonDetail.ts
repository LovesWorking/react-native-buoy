import { useQuery } from "@tanstack/react-query";
import { get, type RequestMethod } from "./apiClient";

// Full Pokemon data interface for detail page
export interface PokemonDetailData {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other?: {
      "official-artwork"?: {
        front_default: string;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
    is_hidden: boolean;
  }>;
}

const fetchPokemonDetail = async (
  pokemonName: string,
  requestMethod: RequestMethod
): Promise<PokemonDetailData> => {
  const response = await get<PokemonDetailData>(
    `https://pokeapi.co/api/v2/pokemon/${pokemonName}`,
    requestMethod
  );

  return response.data;
};

export const usePokemonDetail = (
  pokemonName: string,
  requestMethod: RequestMethod = "fetch"
) => {
  return useQuery({
    queryKey: ["pokemon-detail", pokemonName, requestMethod],
    queryFn: () => fetchPokemonDetail(pokemonName, requestMethod),
    enabled: pokemonName.length > 0,
    // Keep data in cache longer
    gcTime: 1000 * 60 * 10, // 10 minutes
    staleTime: 1000 * 60 * 2, // 2 minutes
    // Don't refetch on reconnect/focus during development
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
