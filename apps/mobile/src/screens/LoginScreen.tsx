import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LoginCredentials } from "@offline/api-client";
import { theme } from "@offline/ui";

interface LoginScreenProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
}

export function LoginScreen({
  isSubmitting,
  errorMessage,
  onSubmit,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validationMessage = useMemo(() => {
    if (!submitted) {
      return null;
    }

    if (!email.trim()) {
      return "Email is required";
    }

    if (!password.trim()) {
      return "Password is required";
    }

    return null;
  }, [email, password, submitted]);

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        password,
      });
    } catch {
      // Error state is surfaced by the auth provider.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text
              style={styles.title}
              testID="login-title"
              accessibilityLabel="login-title"
            >
              Sign in
            </Text>
            <Text style={styles.subtitle}>
              Use your API account to sync assigned projects to this device.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="tech@test.com"
                placeholderTextColor={theme.color.muted}
                style={styles.input}
                editable={!isSubmitting}
                testID="login-email-input"
                accessibilityLabel="login-email-input"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="password"
                placeholderTextColor={theme.color.muted}
                style={styles.input}
                editable={!isSubmitting}
                testID="login-password-input"
                accessibilityLabel="login-password-input"
              />
            </View>

            {(validationMessage || errorMessage) && (
              <View style={styles.errorCard}>
                <Text
                  style={styles.errorText}
                  testID="login-error-text"
                  accessibilityLabel="login-error-text"
                >
                  {validationMessage ?? errorMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={isSubmitting}
              testID="login-submit-button"
              accessibilityLabel="login-submit-button"
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.color.surface} />
              ) : (
                <Text style={styles.submitButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.color.canvas,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: theme.color.canvas,
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.color.ink,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.color.muted,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.color.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.muted + "55",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.color.ink,
    backgroundColor: theme.color.canvas,
  },
  errorCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#ef444420",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.color.accent,
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.color.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});
