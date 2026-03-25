import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { theme } from "@base-template/ui";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>base-template</Text>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.body}>
          Your starting point for building mobile apps. Edit this screen to get
          started.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.canvas,
    padding: 24,
  },
  card: {
    marginTop: 48,
    borderRadius: 24,
    backgroundColor: theme.color.surface,
    padding: 24,
    gap: 12,
  },
  eyebrow: {
    color: theme.color.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: theme.color.ink,
    fontSize: 28,
    fontWeight: "700",
  },
  body: {
    color: theme.color.muted,
    fontSize: 16,
    lineHeight: 24,
  },
});
