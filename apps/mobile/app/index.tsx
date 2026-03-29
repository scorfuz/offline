/**
 * Home Screen - Projects List for Field Techs
 *
 * Entry point showing projects assigned to the authenticated tech.
 * Handles navigation to project detail and comments.
 */

import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { theme } from "@base-template/ui";
import {
  ProjectsListScreen,
  ProjectDetailScreen,
  CommentsScreen,
} from "../src/screens";
import { useProjects } from "../src/lib/powersync";

type Screen = "list" | "detail" | "comments";

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("list");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const { db, isConnected } = useProjects();

  // For now, use a placeholder user ID
  // In a real app, this would come from authentication context
  const currentUserId = "tech-123";

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
    } else {
      setCurrentScreen("list");
      setSelectedProjectId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {currentScreen === "list" && (
        <ProjectsListScreen
          currentUserId={currentUserId}
          onProjectPress={handleProjectPress}
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
