/**
 * PowerSyncConnector - PowerSync Backend Connector implementation
 * Handles JWT token exchange and data upload to API
 */
import type {
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  AbstractPowerSyncDatabase,
} from "@powersync/react-native";
import { UpdateType } from "@powersync/react-native";

export interface PowerSyncConnectorOptions {
  apiOrigin: string;
  powerSyncEndpoint: string;
}

export class PowerSyncConnector implements PowerSyncBackendConnector {
  private apiOrigin: string;
  private powerSyncEndpoint: string;

  constructor(options: PowerSyncConnectorOptions) {
    this.apiOrigin = options.apiOrigin;
    this.powerSyncEndpoint = options.powerSyncEndpoint;
  }

  /**
   * Fetch credentials from the API token endpoint
   * Called by PowerSync to get authentication token
   */
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const response = await fetch(`${this.apiOrigin}/api/powersync/token`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // User not authenticated
      }
      throw new Error(
        `Failed to fetch PowerSync token: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error("Invalid token response from API");
    }

    return {
      endpoint: this.powerSyncEndpoint,
      token: data.token,
      expiresAt: data.expiresAt ? new Date(data.expiresAt * 1000) : undefined,
    };
  }

  /**
   * Upload data to API when local changes need to sync to server
   * Called by PowerSync when there are local mutations to upload
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const batch = await database.getCrudBatch();

    if (!batch || batch.crud.length === 0) {
      return;
    }

    try {
      for (const entry of batch.crud) {
        await this.uploadCrudEntry(entry);
      }

      // Mark batch as complete
      await batch.complete();
    } catch (error) {
      console.error("Failed to upload CRUD batch:", error);
      throw error;
    }
  }

  private async uploadCrudEntry(entry: {
    op: UpdateType;
    table: string;
    id: string;
    opData?: Record<string, unknown>;
  }): Promise<void> {
    const { op, table, id, opData } = entry;

    switch (op) {
      case UpdateType.PUT:
        await this.uploadInsert(table, id, opData ?? {});
        break;
      case UpdateType.PATCH:
        await this.uploadUpdate(table, id, opData ?? {});
        break;
      case UpdateType.DELETE:
        await this.uploadDelete(table, id);
        break;
    }
  }

  private async uploadInsert(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    let endpoint: string;
    switch (table) {
      case "comments":
        endpoint = `/api/projects/${data.project_id}/comments`;
        break;
      default:
        endpoint = `/api/${table}`;
    }

    const response = await fetch(`${this.apiOrigin}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload insert to ${table}: ${response.status}`
      );
    }
  }

  private async uploadUpdate(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const endpoint =
      table === "comments" ? `/api/comments/${id}` : `/api/${table}/${id}`;

    const response = await fetch(`${this.apiOrigin}${endpoint}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload update to ${table}: ${response.status}`
      );
    }
  }

  private async uploadDelete(table: string, id: string): Promise<void> {
    const endpoint =
      table === "comments" ? `/api/comments/${id}` : `/api/${table}/${id}`;

    const response = await fetch(`${this.apiOrigin}${endpoint}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload delete to ${table}: ${response.status}`
      );
    }
  }
}
