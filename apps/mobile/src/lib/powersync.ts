/**
 * PowerSync Mobile Collections and Provider
 *
 * Exports:
 * - ProjectsProvider: React context provider for collections
 * - useProjects: Hook to access collections and sync state
 * - createProjectsCollection: Factory for projects collection
 * - createCommentsCollection: Factory for comments collection
 * - PowerSyncConnector: Backend connector for JWT auth
 * - createPowerSyncDatabase: Factory for database instance
 * - connectPowerSync: Helper to connect database to PowerSync service
 */

export { ProjectsProvider, useProjects } from "./projects-provider";
export {
  createProjectsCollection,
  createCommentsCollection,
  type ProjectsCollection,
  type CommentsCollection,
} from "./collections";
export {
  PowerSyncConnector,
  type PowerSyncConnectorOptions,
} from "./powersync-connector";
export {
  createPowerSyncDatabase,
  connectPowerSync,
  type CreatePowerSyncDatabaseOptions,
} from "./powersync-database";
export { appSchema, type Project, type Comment } from "./powersync-schema";
