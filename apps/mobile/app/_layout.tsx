/**
 * Root Layout with ProjectsProvider
 */
import { Stack } from "expo-router";
import { ProjectsProvider } from "../src/lib/powersync";

// These would typically come from environment variables
const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_ORIGIN ?? "http://localhost:3000";
const POWERSYNC_ENDPOINT =
  process.env.EXPO_PUBLIC_POWERSYNC_ENDPOINT ?? "http://localhost:8080";

export default function RootLayout() {
  return (
    <ProjectsProvider
      apiOrigin={API_ORIGIN}
      powerSyncEndpoint={POWERSYNC_ENDPOINT}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </ProjectsProvider>
  );
}
