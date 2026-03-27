import { Schema } from "effect";

export const UserRole = Schema.Literal("tech", "manager", "admin");

export const AuthenticatedSession = Schema.Struct({
  type: Schema.Literal("authenticated"),
  user: Schema.Struct({
    id: Schema.String,
    email: Schema.String,
    role: Schema.Union(Schema.Null, UserRole),
  }),
});

export const UnauthenticatedSession = Schema.Struct({
  type: Schema.Literal("unauthenticated"),
});

export const AuthSession = Schema.Union(
  AuthenticatedSession,
  UnauthenticatedSession
);

export type UserRole = typeof UserRole.Type;
export type AuthenticatedSession = typeof AuthenticatedSession.Type;
export type UnauthenticatedSession = typeof UnauthenticatedSession.Type;
export type AuthSession = typeof AuthSession.Type;
