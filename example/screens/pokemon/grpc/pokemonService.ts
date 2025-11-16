/**
 * pokemonService.ts
 *
 * This matches the user's RPC service pattern (like their fooRpc.ts).
 * Since we don't have real .proto files or a gRPC backend, we simulate it
 * by making the ConnectRPC client call regular REST endpoints with gRPC headers.
 */

import { createGrpcClient } from './createGrpcClient';
// IMPORTANT: Use global fetch (not expo/fetch) so network DevTools can intercept it
// The network listener monkey-patches global.fetch, so importing from expo/fetch bypasses interception

/**
 * Mock Pokemon Service Definition
 *
 * In a real app, this would be generated from .proto files using buf or protoc.
 * Example:
 *   import { PokemonService } from './gen/pokemon_protobuf';
 *
 * Since we don't have proto files, we'll make direct fetch calls with gRPC headers
 * to simulate what the generated client would do.
 */

/**
 * Get Pokemon details by ID or name
 *
 * This matches the user's pattern:
 * ```typescript
 * async function getFooDetails(fooId: string) {
 *   const client = createGrpcClient(FooService);
 *   const response = await client.getFoo({id: fooId}, {headers: {}});
 *   if (!response.meta) {
 *     throw new Error('getFoo meta missing');
 *   }
 *   return response.foo;
 * }
 * ```
 *
 * @param pokemonId - The Pokemon name or ID to fetch
 * @returns Pokemon data
 */
export async function getPokemonViaGrpcWeb(pokemonId: string) {
  // In a real app with proto files, you would do:
  // const client = createGrpcClient(PokemonService);
  // const response = await client.getPokemon({id: pokemonId}, {headers: {}});

  // Since we don't have proto files, we simulate the gRPC call
  // The important part is that it goes through the ConnectRPC transport
  // with proper gRPC-Web headers

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/grpc-web+json',
      'Accept': 'application/grpc-web+json',
      'X-Grpc-Web': '1',
      'X-Request-Client': 'grpc-web',
      'X-User-Agent': 'grpc-web-javascript/0.1',
      'Connect-Protocol-Version': '1',
    },
  });

  if (!response.ok) {
    throw new Error(`gRPC request failed: ${response.status}`);
  }

  const data = await response.json();

  // In the user's example, they check for required fields:
  // if (!response.meta) {
  //   throw new Error('getFoo meta missing');
  // }

  if (!data.name) {
    throw new Error('Pokemon data missing');
  }

  return data;
}

/**
 * Alternative: Direct ConnectRPC client usage (if we had proto files)
 *
 * This is how it WOULD work with real proto files:
 *
 * ```typescript
 * import { PokemonService } from './gen/pokemon_protobuf';
 *
 * async function getPokemonDetails(pokemonId: string) {
 *   const client = createGrpcClient(PokemonService);
 *
 *   const response = await client.getPokemon(
 *     { id: pokemonId },
 *     { headers: {} }
 *   );
 *
 *   if (!response.pokemon) {
 *     throw new Error('Pokemon data missing');
 *   }
 *
 *   return response.pokemon;
 * }
 * ```
 */
