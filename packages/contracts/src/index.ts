export {
  UserRole,
  AuthSession,
  AuthenticatedSession,
  UnauthenticatedSession,
} from "./auth";
export type {
  UserRole as UserRoleType,
  AuthSession as AuthSessionType,
  AuthenticatedSession as AuthenticatedSessionType,
  UnauthenticatedSession as UnauthenticatedSessionType,
} from "./auth";

export {
  ApiError,
  ApiSuccess,
  LoginRequest,
  AuthenticatedCurrentUserResponse,
  UnauthenticatedCurrentUserResponse,
  CurrentUserResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentsResponse,
  UserSummary,
  UsersResponse,
  RoleQuery,
} from "./api";
export type {
  ApiError as ApiErrorType,
  ApiSuccess as ApiSuccessType,
  LoginRequest as LoginRequestType,
  AuthenticatedCurrentUserResponse as AuthenticatedCurrentUserResponseType,
  UnauthenticatedCurrentUserResponse as UnauthenticatedCurrentUserResponseType,
  CurrentUserResponse as CurrentUserResponseType,
  CreateProjectRequest as CreateProjectRequestType,
  UpdateProjectRequest as UpdateProjectRequestType,
  ProjectsResponse as ProjectsResponseType,
  CreateCommentRequest as CreateCommentRequestType,
  UpdateCommentRequest as UpdateCommentRequestType,
  CommentsResponse as CommentsResponseType,
  UserSummary as UserSummaryType,
  UsersResponse as UsersResponseType,
  RoleQuery as RoleQueryType,
} from "./api";

export { ProjectStatus, Project, Comment } from "./projects";
export type {
  ProjectStatus as ProjectStatusType,
  Project as ProjectType,
  Comment as CommentType,
} from "./projects";

export {
  // RBAC exports
  UserRole as RbacUserRole,
  Permission,
  Resource,
  CheckPermissionRequest,
  CheckPermissionResponse,
  UserWithRole,
  RolePermissionEntry,
  RolePermissions,
  hasPermission,
} from "./rbac";
export type {
  UserRole as RbacUserRoleType,
  Permission as PermissionType,
  Resource as ResourceType,
  CheckPermissionRequest as CheckPermissionRequestType,
  CheckPermissionResponse as CheckPermissionResponseType,
  UserWithRole as UserWithRoleType,
  RolePermissionEntry as RolePermissionEntryType,
} from "./rbac";
