import axios, { AxiosRequestConfig } from "axios";
import { getPokemonViaGrpcWeb } from "./grpc/pokemonService";

export type RequestMethod = "fetch" | "axios" | "graphql" | "grpc-web";

interface RequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  data?: unknown;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Unified API client that supports both fetch and axios
 *
 * This abstraction allows seamless switching between fetch and axios
 * for testing the network dev tools interception capabilities.
 *
 * @param config - Request configuration (url, method, headers, data)
 * @param requestMethod - The HTTP client to use ('fetch' or 'axios')
 * @returns Promise with standardized response format
 */
export const makeRequest = async <T = unknown>(
  config: RequestConfig,
  requestMethod: RequestMethod
): Promise<ApiResponse<T>> => {
  const { url, method = "GET", headers = {}, data } = config;

  if (requestMethod === "fetch") {
    // Fetch implementation
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    // Parse response headers into object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      data: responseData as T,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    };
  } else if (requestMethod === "axios") {
    // Axios implementation (uses XHR under the hood in React Native)
    const axiosConfig: AxiosRequestConfig = {
      url,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      data,
    };

    const response = await axios(axiosConfig);

    return {
      data: response.data as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } else if (requestMethod === "grpc-web") {
    // gRPC-Web implementation using actual ConnectRPC transport
    // This uses the real @connectrpc/connect-web package to make gRPC-web requests

    // Extract pokemon ID from the URL
    const urlWithoutQuery = url.split("?")[0];
    const pokemonId = urlWithoutQuery.split("/").filter(Boolean).pop() || "";

    // Use the real ConnectRPC gRPC-Web service
    // This creates a ConnectRPC transport and makes a proper gRPC-Web request
    const pokemonData = await getPokemonViaGrpcWeb(pokemonId);

    // Return real Pokemon data with gRPC-Web metadata
    return {
      data: pokemonData as T,
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/grpc-web+json",
        "x-grpc-web": "1",
        "x-request-client": "grpc-web",
        "connect-protocol-version": "1",
      },
    };
  } else {
    // GraphQL implementation using axios
    // Uses the official PokéAPI GraphQL endpoint
    const graphqlEndpoint = "https://beta.pokeapi.co/graphql/v1beta";

    // Extract pokemon ID from the URL
    // Assumes URL format like: https://pokeapi.co/api/v2/pokemon/{id}?query=params
    // Remove query parameters first
    const urlWithoutQuery = url.split("?")[0];
    const pokemonId = urlWithoutQuery.split("/").filter(Boolean).pop() || "";

    // GraphQL query to fetch Pokemon data
    const graphqlQuery = {
      query: `
        query GetPokemon($id: String!) {
          pokemon_v2_pokemon(where: {name: {_eq: $id}}) {
            id
            name
            height
            weight
            pokemon_v2_pokemontypes {
              pokemon_v2_type {
                name
              }
            }
            pokemon_v2_pokemonabilities {
              pokemon_v2_ability {
                name
              }
            }
            pokemon_v2_pokemonstats {
              base_stat
              pokemon_v2_stat {
                name
              }
            }
          }
        }
      `,
      variables: {
        id: pokemonId,
      },
    };

    const response = await axios({
      url: graphqlEndpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Client": "graphql",
        ...headers,
      },
      data: graphqlQuery,
    });

    // Transform GraphQL response to match REST API format
    const pokemonData = response.data?.data?.pokemon_v2_pokemon?.[0];

    if (!pokemonData) {
      throw new Error(`Pokemon not found: ${pokemonId}`);
    }

    // Transform to REST API format
    const transformedData = {
      id: pokemonData.id,
      name: pokemonData.name,
      height: pokemonData.height,
      weight: pokemonData.weight,
      types: pokemonData.pokemon_v2_pokemontypes?.map((t: any) => ({
        type: { name: t.pokemon_v2_type.name },
      })) || [],
      abilities: pokemonData.pokemon_v2_pokemonabilities?.map((a: any) => ({
        ability: { name: a.pokemon_v2_ability.name },
      })) || [],
      stats: pokemonData.pokemon_v2_pokemonstats?.map((s: any) => ({
        base_stat: s.base_stat,
        stat: { name: s.pokemon_v2_stat.name },
      })) || [],
      sprites: {
        other: {
          "official-artwork": {
            front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData.id}.png`,
          },
        },
      },
    };

    return {
      data: transformedData as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  }
};

/**
 * Convenience method for GET requests
 */
export const get = <T = unknown>(
  url: string,
  requestMethod: RequestMethod,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return makeRequest<T>({ url, method: "GET", headers }, requestMethod);
};

/**
 * Convenience method for POST requests
 */
export const post = <T = unknown>(
  url: string,
  data: unknown,
  requestMethod: RequestMethod,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return makeRequest<T>({ url, method: "POST", headers, data }, requestMethod);
};
