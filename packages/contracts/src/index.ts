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
