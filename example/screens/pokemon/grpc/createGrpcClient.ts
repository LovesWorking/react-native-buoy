/**
 * createGrpcClient.ts
 *
 * This matches the user's implementation pattern exactly:
 * - Uses DescService from @bufbuild/protobuf
 * - Uses createClient from @connectrpc/connect
 * - Uses createGrpcWebTransport from @connectrpc/connect-web
 * - Uses fetch from expo/fetch
 */

import { DescService } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
// IMPORTANT: Use global fetch (not expo/fetch) so network DevTools can intercept it
// The network listener monkey-patches global.fetch, so importing from expo/fetch bypasses interception

/**
 * Create a gRPC client for a given service
 *
 * This is the exact pattern the user uses in their app.
 * In production, they pass in their actual service definitions (e.g., FooService).
 *
 * @param service - The protobuf service definition (e.g., FooService, PokemonService)
 * @returns A typed ConnectRPC client with all service methods
 */
export function createGrpcClient<T extends DescService>(service: T) {
  const transport = createGrpcWebTransport({
    // In production, this would be: 'https://api.example.com'
    // For testing, we use PokeAPI (even though it's REST, not gRPC)
    baseUrl: 'https://pokeapi.co/api/v2',
    // Use global fetch (already polyfilled by React Native) for network interception compatibility
    fetch: globalThis.fetch,
    // Add interceptors to inject our tracking headers
    interceptors: [
      (next) => async (req) => {
        // Add custom header so our network DevTools can detect this as grpc-web
        req.header.set('X-Request-Client', 'grpc-web');
        return await next(req);
      },
    ],
  });

  return createClient(service, transport);
}
