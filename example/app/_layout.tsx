import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";
import { useRouteObserver } from "@react-buoy/route-events";

export default function RootLayout() {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }

  // Track route changes
  useRouteObserver((event) => {
    console.log("🚀 [Route Tracking] Route changed:", event.pathname);
  });

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <Slot />
    </QueryClientProvider>
  );
}
