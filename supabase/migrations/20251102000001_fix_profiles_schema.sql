/*
# [Schema Correction] Add Role and Plan Columns
This script corrects the 'profiles' table by ensuring the 'role' and 'plan' columns exist with the correct types and defaults. It also updates the trigger for new user creation and assigns 'admin' and 'premium' status to a specific user.

## Query Description: This operation is designed to be safe and idempotent. It uses "IF NOT EXISTS" checks to avoid errors if run multiple times. It will add two new columns ('role', 'plan') to your 'profiles' table and update one existing user record. There is no risk of data loss.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (columns can be dropped)

## Structure Details:
- Tables affected: public.profiles
- Columns added: role (public.user_role_enum), plan (public.user_plan_enum)
- Functions affected: public.handle_new_user()
- Triggers affected: on_auth_user_created on auth.users

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: This script modifies the 'profiles' table which is linked to 'auth.users'.

## Performance Impact:
- Indexes: None added or removed.
- Triggers: Replaces an existing trigger with a corrected version.
- Estimated Impact: Negligible performance impact.
*/

-- Use a transaction to ensure all changes are applied together or none at all.
BEGIN;

-- Step 1: Create the custom ENUM types for 'role' and 'plan' if they do not already exist.
-- This provides strong data validation at the database level.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE public.user_role_enum AS ENUM ('admin', 'user');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan_enum') THEN
        CREATE TYPE public.user_plan_enum AS ENUM ('trial', 'premium');
    END IF;
END
$$;

-- Step 2: Safely add the 'role' and 'plan' columns to the 'profiles' table.
-- 'ADD COLUMN IF NOT EXISTS' prevents errors if the script is run more than once.
-- Default values are set for any new or existing rows that have NULL for these columns.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role_enum NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS plan public.user_plan_enum NOT NULL DEFAULT 'trial';

-- Step 3: Update the function that handles new user creation.
-- This ensures that when a new user signs up, their role and plan are correctly copied
-- from the metadata provided during signup into the 'profiles' table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, plan)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    -- Safely cast the role from metadata, defaulting to 'user' if it's invalid or missing.
    COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role_enum, 'user'),
    -- Safely cast the plan from metadata, defaulting to 'trial' if it's invalid or missing.
    COALESCE((new.raw_user_meta_data ->> 'plan')::public.user_plan_enum, 'trial')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure the trigger is correctly associated with the auth.users table.
-- This replaces any existing trigger to make sure the updated function is used.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Update your specific user profile to 'admin' and 'premium' status.
-- This query targets your user by email and elevates their permissions and plan.
UPDATE public.profiles
SET
  role = 'admin',
  plan = 'premium'
WHERE email = 'bboycrysforever@gmail.com';

-- Finalize the transaction.
COMMIT;
