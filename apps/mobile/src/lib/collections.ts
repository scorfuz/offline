/**
 * TanStack DB Collections with PowerSync
 */
import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import type { PowerSyncDatabase } from "@powersync/react-native";
import { appSchema, type Project, type Comment } from "./powersync-schema";
import { z } from "zod";

// Schema validation for mutations
const projectSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  assigned_tech_id: z.string().nullable(),
  created_by_id: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

const commentSchema = z.object({
  id: z.string(),
  project_id: z.string().nullable(),
  author_id: z.string().nullable(),
  text: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export function createProjectsCollection(db: PowerSyncDatabase) {
  return createCollection(
    powerSyncCollectionOptions({
      database: db,
      table: appSchema.props.projects,
      schema: projectSchema,
      onDeserializationError: (error) => {
        console.error("Projects collection deserialization error:", error);
      },
    })
  );
}

export function createCommentsCollection(db: PowerSyncDatabase) {
  return createCollection(
    powerSyncCollectionOptions({
      database: db,
      table: appSchema.props.comments,
      schema: commentSchema,
      onDeserializationError: (error) => {
        console.error("Comments collection deserialization error:", error);
      },
    })
  );
}

// Collection instance types
export type ProjectsCollection = ReturnType<typeof createProjectsCollection>;
export type CommentsCollection = ReturnType<typeof createCommentsCollection>;
