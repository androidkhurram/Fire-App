# Supabase Setup – Run These SQL Scripts

Your project is configured. Run these in **Supabase → SQL Editor** (in order):

## 1. Create tables

Open **SQL Editor** → **New query** → Paste the full contents of:

```
backend/supabase/migrations/001_initial_schema.sql
```

Click **Run**.

## 2. Allow demo access

Create another new query → Paste the full contents of:

```
backend/supabase/migrations/002_demo_access.sql
```

Click **Run**.

## 3. Allow users read (for admin panel)

Create another new query → Paste the full contents of:

```
backend/supabase/migrations/003_demo_users.sql
```

Click **Run**.

---

## Create Admin User (for Login)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password → **Create user**
4. Copy the user's **UUID** from the users list
5. In **SQL Editor**, run:

```sql
INSERT INTO public.users (id, email, role) 
VALUES ('PASTE-UUID-HERE', 'your-admin@email.com', 'admin');
```

Replace `PASTE-UUID-HERE` and `your-admin@email.com` with your values.

---

## Done

- **iPad app**: Uses Supabase. Add customers/inspections → they save to Supabase.
- **Admin panel**: Login at `/login`, then view Dashboard, Customers, Inspections, Reports, Technicians.
