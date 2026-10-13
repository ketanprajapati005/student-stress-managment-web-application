-- Users could previously update their own profile's `role` (the UPDATE policy only
-- checks ownership), so any student could make themselves a counselor and read every
-- user's alerts. Block role changes unless they come from a privileged connection
-- (service role / dashboard SQL), where auth.uid() is null.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Changing profile role is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- The insert policy has the same hole for a profile that doesn't exist yet;
-- profiles are created by the handle_new_user trigger, so only allow the default role.
DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id AND role = 'student');
