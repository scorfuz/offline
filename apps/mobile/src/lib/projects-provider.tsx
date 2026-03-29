/**
 * Projects Context Provider
 * Provides PowerSync collections and sync state to the app
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { PowerSyncDatabase } from "@powersync/react-native";
import {
  createProjectsCollection,
  createCommentsCollection,
  ProjectsCollection,
  CommentsCollection,
} from "./collections";
import { PowerSyncConnector } from "./powersync-connector";
import { connectPowerSync } from "./powersync-database";

interface ProjectsContextValue {
  db: PowerSyncDatabase | null;
  projectsCollection: ProjectsCollection | null;
  commentsCollection: CommentsCollection | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  db: null,
  projectsCollection: null,
  commentsCollection: null,
  isConnected: false,
  isLoading: true,
  error: null,
});

export const useProjects = () => useContext(ProjectsContext);

interface ProjectsProviderProps {
  children: React.ReactNode;
  apiOrigin: string;
  powerSyncEndpoint: string;
}

export function ProjectsProvider({
  children,
  apiOrigin,
  powerSyncEndpoint,
}: ProjectsProviderProps) {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [projectsCollection, setProjectsCollection] =
    useState<ProjectsCollection | null>(null);
  const [commentsCollection, setCommentsCollection] =
    useState<CommentsCollection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Dynamic import to avoid issues with Node.js test environment
        const { createPowerSyncDatabase, connectPowerSync } =
          await import("./powersync-database");

        const { db: powerSyncDb, connector } = createPowerSyncDatabase({
          apiOrigin,
          powerSyncEndpoint,
        });

        if (!mounted) return;

        setDb(powerSyncDb);
        setProjectsCollection(createProjectsCollection(powerSyncDb));
        setCommentsCollection(createCommentsCollection(powerSyncDb));

        // Connect to PowerSync service
        await connectPowerSync(powerSyncDb, connector);

        if (!mounted) return;

        setIsConnected(true);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [apiOrigin, powerSyncEndpoint]);

  return (
    <ProjectsContext.Provider
      value={{
        db,
        projectsCollection,
        commentsCollection,
        isConnected,
        isLoading,
        error,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}
