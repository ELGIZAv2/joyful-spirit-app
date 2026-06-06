
-- Remove overly-permissive Realtime policies that let any authenticated user
-- subscribe to or broadcast on any channel.
DROP POLICY IF EXISTS "authenticated_can_receive" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_can_send" ON realtime.messages;

-- Remove world-readable SELECT on the memories table; only service_role
-- should access it (write access is already service_role only).
DROP POLICY IF EXISTS "Authenticated can read memories" ON public.memories;
