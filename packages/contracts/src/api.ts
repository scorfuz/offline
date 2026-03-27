import { Schema } from "effect";

import { type UserRole, UserRole as AuthUserRole } from "./auth";
import { Comment, Project, ProjectStatus } from "./projects";

export const ApiError = Schema.Struct({
  error: Schema.String,
});

export type ApiError = typeof ApiError.Type;

export const ApiSuccess = Schema.Struct({
  success: Schema.Boolean,
});

export type ApiSuccess = typeof ApiSuccess.Type;

export const LoginRequest = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});

export type LoginRequest = typeof LoginRequest.Type;

export const AuthenticatedCurrentUserResponse = Schema.Struct({
  authenticated: Schema.Literal(true),
  session: Schema.Struct({
    id: Schema.String,
    expiresAt: Schema.String,
  }),
  user: Schema.Struct({
    id: Schema.String,
    email: Schema.String,
    displayName: Schema.NullOr(Schema.String),
    role: Schema.NullOr(AuthUserRole),
  }),
});

export type AuthenticatedCurrentUserResponse =
  typeof AuthenticatedCurrentUserResponse.Type;

export const UnauthenticatedCurrentUserResponse = Schema.Struct({
  authenticated: Schema.Literal(false),
  session: Schema.Null,
  user: Schema.Null,
});

export type UnauthenticatedCurrentUserResponse =
  typeof UnauthenticatedCurrentUserResponse.Type;

export const CurrentUserResponse = Schema.Union(
  AuthenticatedCurrentUserResponse,
  UnauthenticatedCurrentUserResponse
);

export type CurrentUserResponse = typeof CurrentUserResponse.Type;

export const CreateProjectRequest = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
  status: Schema.optional(ProjectStatus),
  assignedTechId: Schema.optional(Schema.NullOr(Schema.String)),
});

export type CreateProjectRequest = typeof CreateProjectRequest.Type;

export const UpdateProjectRequest = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  status: Schema.optional(ProjectStatus),
  assignedTechId: Schema.optional(Schema.NullOr(Schema.String)),
});

export type UpdateProjectRequest = typeof UpdateProjectRequest.Type;

export const ProjectsResponse = Schema.Array(Project);

export type ProjectsResponse = typeof ProjectsResponse.Type;

export const CreateCommentRequest = Schema.Struct({
  text: Schema.String,
});

export type CreateCommentRequest = typeof CreateCommentRequest.Type;

export const UpdateCommentRequest = Schema.Struct({
  text: Schema.String,
});

export type UpdateCommentRequest = typeof UpdateCommentRequest.Type;

export const CommentsResponse = Schema.Array(Comment);

export type CommentsResponse = typeof CommentsResponse.Type;

export const UserSummary = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  displayName: Schema.NullOr(Schema.String),
  role: Schema.NullOr(AuthUserRole),
});

export type UserSummary = typeof UserSummary.Type;

export const UsersResponse = Schema.Array(UserSummary);

export type UsersResponse = typeof UsersResponse.Type;

export const RoleQuery = AuthUserRole;

export type RoleQuery = UserRole;
