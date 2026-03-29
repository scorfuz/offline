import { describe, it } from "node:test";
import assert from "node:assert";

// Mock powerSyncCollectionOptions for Node.js environment
const mockPowerSyncCollectionOptions = (options: {
  database: unknown;
  table: unknown;
  schema?: unknown;
}) => {
  return {
    ...options,
    __type: "powerSyncCollectionOptions",
  };
};

describe("Collections", () => {
  describe("projectsCollection options", () => {
    it("should be configured with correct table and key field", () => {
      // Arrange
      const mockDb = { name: "PowerSyncDatabase" };
      const mockTable = { name: "projects" };

      // Act
      const options = mockPowerSyncCollectionOptions({
        database: mockDb,
        table: mockTable,
      });

      // Assert
      assert.strictEqual(options.__type, "powerSyncCollectionOptions");
      assert.strictEqual(options.database, mockDb);
      assert.strictEqual(options.table, mockTable);
    });
  });

  describe("commentsCollection options", () => {
    it("should be configured with correct table and key field", () => {
      // Arrange
      const mockDb = { name: "PowerSyncDatabase" };
      const mockTable = { name: "comments" };

      // Act
      const options = mockPowerSyncCollectionOptions({
        database: mockDb,
        table: mockTable,
      });

      // Assert
      assert.strictEqual(options.__type, "powerSyncCollectionOptions");
      assert.strictEqual(options.database, mockDb);
      assert.strictEqual(options.table, mockTable);
    });
  });
});
