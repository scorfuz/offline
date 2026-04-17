import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@offline/ui";
import {
  CommentsScreen,
  ProjectDetailScreen,
  ProjectsListScreen,
} from "./index";

type Screen = "list" | "detail" | "comments";

interface AuthenticatedHomeScreenProps {
  currentUserId: string;
  currentUserEmail: string;
  onLogoutPress: () => Promise<void>;
}

export function AuthenticatedHomeScreen({
  currentUserId,
  currentUserEmail,
  onLogoutPress,
}: AuthenticatedHomeScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("list");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const handleProjectPress = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentScreen("detail");
  };

  const handleViewComments = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentScreen("comments");
  };

  const handleBack = () => {
    if (currentScreen === "comments") {
      setCurrentScreen("detail");
      return;
    }

    setCurrentScreen("list");
    setSelectedProjectId(null);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {currentScreen === "list" && (
        <ProjectsListScreen
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          onProjectPress={handleProjectPress}
          onLogoutPress={onLogoutPress}
        />
      )}
      {currentScreen === "detail" && selectedProjectId && (
        <ProjectDetailScreen
          projectId={selectedProjectId}
          currentUserId={currentUserId}
          onBack={handleBack}
          onViewComments={handleViewComments}
        />
      )}
      {currentScreen === "comments" && selectedProjectId && (
        <CommentsScreen
          projectId={selectedProjectId}
          currentUserId={currentUserId}
          onBack={handleBack}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.canvas,
  },
});
