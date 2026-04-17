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
  dbFilename?: string;
}

export function ProjectsProvider({
  children,
  apiOrigin,
  powerSyncEndpoint,
  dbFilename,
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
    let powerSyncDb: PowerSyncDatabase | null = null;

    setDb(null);
    setProjectsCollection(null);
    setCommentsCollection(null);
    setIsConnected(false);
    setIsLoading(true);
    setError(null);

    async function init() {
      try {
        // Dynamic import to avoid issues with Node.js test environment
        const { createPowerSyncDatabase, connectPowerSync } =
          await import("./powersync-database");

        const { db: nextDb, connector } = createPowerSyncDatabase({
          apiOrigin,
          powerSyncEndpoint,
          dbFilename,
        });

        powerSyncDb = nextDb;

        if (!mounted) {
          await nextDb.close();
          return;
        }

        setDb(nextDb);
        setProjectsCollection(createProjectsCollection(nextDb));
        setCommentsCollection(createCommentsCollection(nextDb));

        await connectPowerSync(nextDb, connector);

        if (!mounted) {
          await nextDb.disconnectAndClear();
          await nextDb.close();
          return;
        }

        setIsConnected(true);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void init();

    return () => {
      mounted = false;

      if (powerSyncDb) {
        const dbToDispose = powerSyncDb;

        void dbToDispose
          .disconnectAndClear()
          .catch(() => undefined)
          .finally(() => {
            void dbToDispose.close().catch(() => undefined);
          });
      }
    };
  }, [apiOrigin, powerSyncEndpoint, dbFilename]);

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
