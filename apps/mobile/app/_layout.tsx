/**
 * Root layout with auth provider.
 */
import "../src/lib/crypto-polyfill";

import { requireOptionalNativeModule } from "expo";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "../src/lib/auth";

type DevMenuPreferencesModule = {
  setPreferencesAsync: (settings: {
    showFloatingActionButton?: boolean;
    motionGestureEnabled?: boolean;
    touchGestureEnabled?: boolean;
    keyCommandsEnabled?: boolean;
    showsAtLaunch?: boolean;
  }) => Promise<void>;
};

const DevMenuPreferences =
  requireOptionalNativeModule<DevMenuPreferencesModule>("DevMenuPreferences");

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_ORIGIN ?? "http://localhost:3001";

export default function RootLayout() {
  useEffect(() => {
    void DevMenuPreferences?.setPreferencesAsync({
      showFloatingActionButton: false,
      motionGestureEnabled: false,
      touchGestureEnabled: false,
      keyCommandsEnabled: false,
      showsAtLaunch: false,
    });
  }, []);

  return (
    <AuthProvider apiOrigin={API_ORIGIN}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
