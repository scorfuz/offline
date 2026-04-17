import { Schema } from "effect";

export const UserRole = Schema.Literal("tech", "manager", "admin");

const authenticatedType = Schema.Literal("authenticated");
const nullableUserRole = Schema.Union(Schema.Null, UserRole);
const userStruct = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  role: nullableUserRole,
});
export const AuthenticatedSession = Schema.Struct({
  type: authenticatedType,
  user: userStruct,
});

const unauthenticatedType = Schema.Literal("unauthenticated");
export const UnauthenticatedSession = Schema.Struct({
  type: unauthenticatedType,
});

export const AuthSession = Schema.Union(
  AuthenticatedSession,
  UnauthenticatedSession
);

export type UserRole = typeof UserRole.Type;
export type AuthenticatedSession = typeof AuthenticatedSession.Type;
export type UnauthenticatedSession = typeof UnauthenticatedSession.Type;
export type AuthSession = typeof AuthSession.Type;
