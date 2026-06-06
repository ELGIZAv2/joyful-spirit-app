-- ============================================================
-- 1. v0_api_keys — صريح: service role only
-- ============================================================
CREATE POLICY "Service role manages v0_api_keys"
ON public.v0_api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 2. anonymous_chat_usage — anon يقدر يضيف/يقرأ سجلاته فقط
-- ============================================================
GRANT SELECT, INSERT ON public.anonymous_chat_usage TO anon;
GRANT ALL ON public.anonymous_chat_usage TO service_role;

CREATE POLICY "Anyone can insert anonymous usage"
ON public.anonymous_chat_usage
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service role manages anonymous usage"
ON public.anonymous_chat_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 3. showcase_items — قفل insert من anon (إبقاء SELECT العام)
-- ============================================================
DROP POLICY IF EXISTS "showcase_items_anon_insert" ON public.showcase_items;

-- ============================================================
-- 4 & 5. منع listing على buckets user-images و workspace-assets
--    (الـ public GET بـ URL مباشر يبقى شغال)
-- ============================================================
-- إنشاء policy بتمنع الـ list من anon بس بتسمح بالقراءة المباشرة لو عارف الـ path
-- أي policy SELECT موجودة على storage.objects للـ buckets دي ممكن تتحوّل لمعتمدة على owner

-- نضمن إن مفيش "Anyone can list" — anon لازم يكون عنده الـ object path تحديداً
-- (Supabase storage الـ public GET بشتغل عن طريق /object/public/ مش بـ list)

-- بنحذف أي policy تسمح بـ SELECT broad على الـ 2 buckets
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual LIKE '%user-images%' OR qual LIKE '%workspace-assets%')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- نضيف policy: فقط الـ owner يقدر يـ list ملفاته
CREATE POLICY "Users list own user-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'user-images' AND owner = auth.uid());

CREATE POLICY "Users list own workspace-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'workspace-assets' AND owner = auth.uid());

-- ملحوظة: الـ public bucket access (GET على /object/public/<bucket>/<path>)
-- بيشتغل من غير الحاجة للـ SELECT policy، فالصور المعروضة بـ public URL هتفضل شغالة.