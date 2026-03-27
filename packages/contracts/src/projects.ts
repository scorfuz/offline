import { Schema } from "effect";

export const ProjectStatus = Schema.Literal("open", "in_progress", "completed");
export type ProjectStatus = typeof ProjectStatus.Type;

export const Project = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: ProjectStatus,
  assignedTechId: Schema.NullOr(Schema.String),
  createdById: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Project = typeof Project.Type;

export const Comment = Schema.Struct({
  id: Schema.String,
  projectId: Schema.String,
  authorId: Schema.String,
  text: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Comment = typeof Comment.Type;
