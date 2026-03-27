import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { authUsers } from "./auth-schema";

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("open"),
    assignedTechId: text("assigned_tech_id").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIndex: index("projects_status_idx").on(table.status),
    assignedTechIndex: index("projects_assigned_tech_idx").on(
      table.assignedTechId
    ),
    createdByIndex: index("projects_created_by_idx").on(table.createdById),
  })
);

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIndex: index("comments_project_id_idx").on(table.projectId),
    authorIndex: index("comments_author_id_idx").on(table.authorId),
  })
);
