# Supabase Adapter

This package ships an optional Supabase adapter for `app-notifications`.

## Install

```bash
npm install app-notifications @supabase/supabase-js
```

## Apply the Migration

Copy the shipped SQL migration into your Supabase project's migrations directory:

```bash
cp node_modules/app-notifications/sql/supabase-notifications.sql \
  supabase/migrations/20260409000000_app_notifications.sql
```

Then apply it with your normal Supabase workflow:

```bash
supabase db push
```

## Use the Adapter

Create a server-side Supabase client with access to the `notifications` table:

```ts
import { createClient } from "@supabase/supabase-js";
import { createNotificationsService } from "app-notifications";
import { SupabaseNotificationsStore } from "app-notifications/supabase";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const notifications = createNotificationsService({
  store: new SupabaseNotificationsStore({ supabase }),
});
```

You can override the table name if your project uses a different relation:

```ts
const notifications = createNotificationsService({
  store: new SupabaseNotificationsStore({
    supabase,
    tableName: "notifications",
  }),
});
```

## Example

```ts
await notifications.create({
  id: crypto.randomUUID(),
  userId: "user-123",
  type: "review_helpful",
  title: "+5 credits earned",
  body: "Your review was marked helpful.",
  dedupeKey: "review_helpful:feedback-456",
  data: {
    feedbackId: "feedback-456",
    amount: 5,
  },
  createdAt: new Date(),
});
```

## Notes

- The adapter is intended for server-side Supabase usage.
- The package ships the SQL in `sql/supabase-notifications.sql`.
- The `app-notifications/supabase` entrypoint also exports `supabaseNotificationsSchemaSql` for custom tooling.
