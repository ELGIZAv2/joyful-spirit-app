DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'operator_runs'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.operator_runs;
  END IF;
END $$;