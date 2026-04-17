/**
 * PowerSync Database Setup
 */
import { PowerSyncDatabase } from "@powersync/react-native";
import { appSchema } from "./powersync-schema";
import { PowerSyncConnector } from "./powersync-connector";

export interface CreatePowerSyncDatabaseOptions {
  apiOrigin: string;
  powerSyncEndpoint: string;
  dbFilename?: string;
}

export function createPowerSyncDatabase(
  options: CreatePowerSyncDatabaseOptions
) {
  const db = new PowerSyncDatabase({
    database: { dbFilename: options.dbFilename ?? "offline.sqlite" },
    schema: appSchema,
  });

  const connector = new PowerSyncConnector({
    apiOrigin: options.apiOrigin,
    powerSyncEndpoint: options.powerSyncEndpoint,
  });

  return { db, connector };
}

export async function connectPowerSync(
  db: PowerSyncDatabase,
  connector: PowerSyncConnector
) {
  await db.connect(connector);
}

export type { PowerSyncDatabase };
