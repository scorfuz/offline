/**
 * PowerSync Schema and Database Configuration
 */
import { Schema, Table, column } from "@powersync/react-native";

export const appSchema = new Schema({
  projects: new Table({
    title: column.text,
    description: column.text,
    status: column.text,
    assigned_tech_id: column.text,
    created_by_id: column.text,
    created_at: column.text,
    updated_at: column.text,
  }),
  comments: new Table({
    project_id: column.text,
    author_id: column.text,
    text: column.text,
    created_at: column.text,
    updated_at: column.text,
  }),
});

export type ProjectStatus = "open" | "in_progress" | "completed";

export interface Project {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  assigned_tech_id: string | null;
  created_by_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Comment {
  id: string;
  project_id: string | null;
  author_id: string | null;
  text: string | null;
  created_at: string | null;
  updated_at: string | null;
}
