import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "@offline/ui";
import { useAuth } from "../src/lib/auth";
import { ProjectsProvider } from "../src/lib/powersync";
import { AuthenticatedHomeScreen, LoginScreen } from "../src/screens";

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_ORIGIN ?? "http://localhost:3001";
const POWERSYNC_ENDPOINT =
  process.env.EXPO_PUBLIC_POWERSYNC_ENDPOINT ?? "http://localhost:8080";

function LoadingScreen() {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={theme.color.accent} />
      <Text style={styles.loadingText}>Checking session...</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { session, isLoading, isSubmitting, error, login, logout, clearError } =
    useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (session.type === "unauthenticated") {
    return (
      <LoginScreen
        isSubmitting={isSubmitting}
        errorMessage={error}
        onSubmit={async (credentials) => {
          clearError();
          await login(credentials);
        }}
      />
    );
  }

  const dbFilename = `offline-${session.user.id.replace(/[^a-zA-Z0-9_-]/g, "_")}.sqlite`;

  return (
    <ProjectsProvider
      key={session.user.id}
      apiOrigin={API_ORIGIN}
      powerSyncEndpoint={POWERSYNC_ENDPOINT}
      dbFilename={dbFilename}
    >
      <AuthenticatedHomeScreen
        currentUserId={session.user.id}
        currentUserEmail={session.user.email}
        onLogoutPress={logout}
      />
    </ProjectsProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.color.canvas,
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: theme.color.muted,
  },
});
