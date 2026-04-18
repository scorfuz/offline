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

const authenticatedLiteral = Schema.Literal(true);
const sessionStruct = Schema.Struct({
  id: Schema.String,
  expiresAt: Schema.String,
});
const nullableDisplayName = Schema.NullOr(Schema.String);
const nullableAuthUserRole = Schema.NullOr(AuthUserRole);
const authenticatedUserStruct = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  displayName: nullableDisplayName,
  role: nullableAuthUserRole,
});
export const AuthenticatedCurrentUserResponse = Schema.Struct({
  authenticated: authenticatedLiteral,
  session: sessionStruct,
  user: authenticatedUserStruct,
});

export type AuthenticatedCurrentUserResponse =
  typeof AuthenticatedCurrentUserResponse.Type;

const unauthenticatedLiteral = Schema.Literal(false);
export const UnauthenticatedCurrentUserResponse = Schema.Struct({
  authenticated: unauthenticatedLiteral,
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

const optionalString = Schema.optional(Schema.String);
const optionalProjectStatus = Schema.optional(ProjectStatus);
const nullableString = Schema.NullOr(Schema.String);
const optionalNullableString = Schema.optional(nullableString);
const optionalId = Schema.optional(Schema.String);

export const CreateProjectRequest = Schema.Struct({
  id: optionalId,
  title: Schema.String,
  description: optionalString,
  status: optionalProjectStatus,
  assignedTechId: optionalNullableString,
});

export type CreateProjectRequest = typeof CreateProjectRequest.Type;

export const UpdateProjectRequest = Schema.Struct({
  title: optionalString,
  description: optionalString,
  status: optionalProjectStatus,
  assignedTechId: optionalNullableString,
});

export type UpdateProjectRequest = typeof UpdateProjectRequest.Type;

export const ProjectsResponse = Schema.Array(Project);

export type ProjectsResponse = typeof ProjectsResponse.Type;

export const CreateCommentRequest = Schema.Struct({
  id: optionalId,
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
  displayName: nullableDisplayName,
  role: nullableAuthUserRole,
});

export type UserSummary = typeof UserSummary.Type;

export const UsersResponse = Schema.Array(UserSummary);

export type UsersResponse = typeof UsersResponse.Type;

export const RoleQuery = AuthUserRole;

export type RoleQuery = UserRole;
