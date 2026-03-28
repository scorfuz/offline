# PowerSync Cloud Setup Guide

> Issue #5: PowerSync Cloud Setup + Sync Streams
>
> This is a HITL (Human-in-the-Loop) task requiring manual configuration in the PowerSync Cloud dashboard.

## Prerequisites

- PowerSync Cloud account (https://app.powersync.com)
- Postgres database running with the base-template schema (projects, comments, auth_users tables)
- API deployed with the `/api/powersync/token` endpoint (Issue #4)
- **Minimum SDK versions for Sync Streams** (see below)

## Sync Streams vs Legacy Sync Rules

PowerSync has introduced **Sync Streams (Beta)** which replaces the legacy **Sync Rules** system.

| Feature          | Legacy Sync Rules      | New Sync Streams                   |
| ---------------- | ---------------------- | ---------------------------------- |
| Root key         | `bucket_definitions:`  | `streams:`                         |
| User ID function | `request.user_id()`    | `auth.user_id()`                   |
| Parameter access | `request.parameters()` | `subscription.parameter()`         |
| Auto-sync        | Always eager           | Configurable with `auto_subscribe` |

**Key benefits of Sync Streams:**

- More flexible sync behavior (not always "sync everything upfront")
- Better for web apps where users are mostly online
- Subscription-based filtering instead of bucket-based

**For offline-first use cases** (like this field tech app), we still use `auto_subscribe: true` to maintain the same behavior.

**Minimum SDK Versions for Sync Streams:**

| SDK            | Minimum Version |
| -------------- | --------------- |
| JavaScript/Web | v1.27.0         |
| React Native   | v1.25.0         |
| Flutter/Dart   | v1.16.0         |
| Kotlin         | v1.7.0          |
| Swift          | v1.11.0         |

## Setup Steps

### 1. Create PowerSync Instance

1. Log in to [PowerSync Cloud](https://app.powersync.com)
2. Click "Create Instance"
3. Choose your region
4. Select your plan (Free tier works for prototyping)

### 2. Connect Postgres Database

In your PowerSync instance dashboard:

1. Go to **Database** tab
2. Click **Connect Database**
3. Enter your Postgres connection string:
   ```
   postgresql://[user]:[password]@[host]:[port]/[database]
   ```
   > ⚠️ Use a read-only replication slot if available for production
4. Test the connection
5. Enable **WAL (Write-Ahead Logging)** for real-time sync:
   - PowerSync requires `wal_level = logical`
   - Run in your database: `ALTER SYSTEM SET wal_level = logical;`
   - Restart Postgres

### 3. Upload Sync Streams Configuration

1. Go to **Sync Streams** tab in PowerSync dashboard (not "Sync Rules")
2. Click **Upload Configuration**
3. Select or copy-paste the contents of `apps/api/powersync/sync-streams.yaml`
4. Validate the configuration
5. Deploy the streams

> **Note:** The file is `sync-streams.yaml` (not `sync-rules.yaml`) and uses the new `streams:` format.

### 4. Configure JWT Authentication

1. Go to **Authentication** tab
2. Set **Token Endpoint URL**:
   ```
   https://your-api-domain.com/api/powersync/token
   ```
3. Configure allowed origins if needed for CORS
4. Test the authentication flow using the PowerSync dashboard

### 5. Verification

#### Manual Verification Steps

1. **Create test data** in Postgres:

   ```sql
   -- Create an admin user
   INSERT INTO auth_users (id, email, display_name, role)
   VALUES ('admin-1', 'admin@test.com', 'Test Admin', 'admin');

   -- Create a tech user
   INSERT INTO auth_users (id, email, display_name, role)
   VALUES ('tech-1', 'tech@test.com', 'Test Tech', 'tech');

   -- Create projects
   INSERT INTO projects (id, title, description, status, assigned_tech_id, created_by_id)
   VALUES
     ('project-1', 'Tech Project 1', 'Assigned to tech-1', 'open', 'tech-1', 'admin-1'),
     ('project-2', 'Tech Project 2', 'Assigned to tech-1', 'in_progress', 'tech-1', 'admin-1'),
     ('project-3', 'Unassigned Project', 'No tech assigned', 'open', NULL, 'admin-1');

   -- Add comments
   INSERT INTO comments (id, project_id, author_id, text)
   VALUES
     ('comment-1', 'project-1', 'admin-1', 'Initial comment'),
     ('comment-2', 'project-2', 'tech-1', 'Tech update');
   ```

2. **Open PowerSync Dashboard** → **Sync Stream** tab
3. **Connect as admin user** (using the token endpoint):
   - Should see: all 3 projects and both comments
4. **Connect as tech user**:
   - Should see: only project-1 and project-2 (assigned to tech-1)
   - Should see: only comments on those projects

### 6. Mobile Client Setup

Once PowerSync Cloud is configured, mobile clients connect using the PowerSync client library:

```typescript
// Mobile client configuration for Sync Streams
import { PowerSyncDatabase } from "@powersync/web";
import { createCollection } from "@tanstack/react-db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";

const db = new PowerSyncDatabase({
  database: { dbFilename: "app.sqlite" },
  schema: AppSchema,
});

const connector = new PowerSyncBackendConnector({
  endpoint: "https://your-powersync-instance.powersync.com",
  tokenProvider: async () => {
    const res = await fetch("/api/powersync/token", { method: "POST" });
    const { token } = await res.json();
    return token;
  },
});

// Sync Streams auto-subscribe based on server configuration
await db.connect(connector);
```

## Sync Streams Summary

| Stream           | User Type | Data Access                         | Auto-Subscribe |
| ---------------- | --------- | ----------------------------------- | -------------- |
| `admin_projects` | Admin     | ALL projects                        | ✅ Yes         |
| `admin_comments` | Admin     | ALL comments                        | ✅ Yes         |
| `tech_projects`  | Tech      | Only `assigned_tech_id = user_id`   | ✅ Yes         |
| `tech_comments`  | Tech      | Comments on their assigned projects | ✅ Yes         |
| `user_profile`   | All       | Own user profile                    | ✅ Yes         |

## Troubleshooting

### "WAL level not set to logical"

- Restart Postgres after changing `wal_level`
- Verify with: `SHOW wal_level;`

### "Authentication failed"

- Check that `/api/powersync/token` returns a valid JWT
- Verify the JWT has `sub` (user ID) and `role` claims
- Check token expiry (currently 5 minutes)

### "No data syncing"

- Verify database connection in PowerSync dashboard
- Check sync streams are deployed (not just uploaded)
- Look at Sync Stream tab for real-time sync events
- Verify `auto_subscribe: true` is set in the YAML

### "SDK version incompatible with Sync Streams"

- Update to minimum SDK version (see table above)
- For React Native: `@powersync/react-native` ≥ v1.25.0
- For Web: `@powersync/web` ≥ v1.27.0

## Migration from Legacy Sync Rules

If you previously used `sync-rules.yaml` with `bucket_definitions:`, the migration is:

1. Rename to `sync-streams.yaml`
2. Change `bucket_definitions:` to `streams:`
3. Replace `request.user_id()` with `auth.user_id()`
4. Replace `parameters` + `data` sections with `query:` directly
5. Add `auto_subscribe: true` for offline-first behavior

See: https://docs.powersync.com/sync/streams/migration

## Acceptance Criteria Checklist

From Issue #5:

- [x] Sync streams file created (`apps/api/powersync/sync-streams.yaml`)
- [x] Sync streams defined for `projects` table with tech-scoped filtering
- [x] Sync streams defined for `comments` table scoped to visible projects
- [ ] PowerSync Cloud instance connected to Postgres (HITL)
- [ ] JWT authentication configured in PowerSync dashboard (HITL)
- [ ] Manual verification completed (HITL)
- [ ] Admin user syncs all projects and comments (verified)
- [ ] Tech user syncs only their assigned projects and related comments (verified)

**Note:** The HITL items (marked) require manual action in the PowerSync Cloud dashboard.
