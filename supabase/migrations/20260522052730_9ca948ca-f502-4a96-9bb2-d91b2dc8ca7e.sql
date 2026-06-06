ALTER TABLE public.model_pricing ADD COLUMN IF NOT EXISTS min_credits NUMERIC;
ALTER TABLE public.model_pricing ADD COLUMN IF NOT EXISTS max_credits NUMERIC;
ALTER TABLE public.model_pricing DROP CONSTRAINT IF EXISTS model_pricing_kind_check;
ALTER TABLE public.model_pricing ADD CONSTRAINT model_pricing_kind_check CHECK (kind IN ('image','video','audio','chat','code'));

INSERT INTO public.model_pricing (id, provider, kind, label, endpoint, unit, credits_per_unit, min_credits, max_credits, in_price_per_m, out_price_per_m, icon, badge, sort_order) VALUES
('fal:nano-banana-pro','fal','image','Nano Banana Pro','fal-ai/nano-banana/pro','image',2,NULL,NULL,NULL,NULL,'/model-logos/google.svg','New',1),
('fal:flux-2-pro','fal','image','FLUX 2 Pro','fal-ai/flux-2/pro','image',1,NULL,NULL,NULL,NULL,'/model-logos/bfl.svg','Pro',2),
('fal:flux-2-flash','fal','image','FLUX 2 Flash','fal-ai/flux-2/flash','image',1,NULL,NULL,NULL,NULL,'/model-logos/bfl.svg',NULL,3),
('fal:ideogram-v3','fal','image','Ideogram V3','fal-ai/ideogram/v3','image',1,NULL,NULL,NULL,NULL,'/model-logos/ideogram.svg',NULL,4),
('fal:recraft-v3','fal','image','Recraft V3','fal-ai/recraft-v3','image',1,NULL,NULL,NULL,NULL,'/model-logos/recraft.svg',NULL,5),
('fal:seedream-4','fal','image','Seedream 4','fal-ai/bytedance/seedream/v4','image',1,NULL,NULL,NULL,NULL,'/model-logos/bytedance.svg',NULL,6),
('runware:gpt-image-2','runware','image','GPT Image 2','openai:gpt-image-2','image',3,NULL,NULL,NULL,NULL,'/model-logos/openai.svg','Premium',10),
('runware:flux-dev','runware','image','FLUX Dev','runware:101@1','image',1,NULL,NULL,NULL,NULL,'/model-logos/bfl.svg',NULL,11),
('runware:sd35-large','runware','image','SD 3.5 Large','runware:100@1','image',1,NULL,NULL,NULL,NULL,'/model-logos/stability.svg',NULL,12),
('fal:veo-3-1-fast','fal','video','Veo 3.1 Fast','fal-ai/veo3/fast','second',0.3,NULL,NULL,NULL,NULL,'/model-logos/google.svg','New',20),
('fal:veo-3-1','fal','video','Veo 3.1','fal-ai/veo3','second',0.5,NULL,NULL,NULL,NULL,'/model-logos/google.svg',NULL,21),
('fal:veo-3-1-pro','fal','video','Veo 3.1 Pro','fal-ai/veo3/pro','second',1.0,NULL,NULL,NULL,NULL,'/model-logos/google.svg','Pro',22),
('fal:kling-3-pro','fal','video','Kling 3.0 Pro','fal-ai/kling-video/v3/pro','second',0.5,NULL,NULL,NULL,NULL,'/model-logos/kling.svg',NULL,23),
('fal:kling-3-std','fal','video','Kling 3.0 Std','fal-ai/kling-video/v3/standard','second',0.3,NULL,NULL,NULL,NULL,'/model-logos/kling.svg',NULL,24),
('fal:seedance-pro','fal','video','Seedance Pro','fal-ai/bytedance/seedance/v1/pro','second',0.4,NULL,NULL,NULL,NULL,'/model-logos/bytedance.svg',NULL,25),
('fal:hunyuan-video','fal','video','Hunyuan Video','fal-ai/hunyuan-video','second',0.2,NULL,NULL,NULL,NULL,'/model-logos/tencent.svg',NULL,26),
('fal:wan-2-2','fal','video','Wan 2.2','fal-ai/wan/v2.2','second',0.3,NULL,NULL,NULL,NULL,'/model-logos/alibaba.svg',NULL,27),
('fal:luma-dream','fal','video','Luma Dream Machine','fal-ai/luma-dream-machine','second',0.5,NULL,NULL,NULL,NULL,'/model-logos/luma.svg',NULL,28),
('fal:pika-2-2','fal','video','Pika 2.2','fal-ai/pika/v2.2','second',0.4,NULL,NULL,NULL,NULL,'/model-logos/pika.svg',NULL,29),
('v0:v0-1.5-md','v0','code','v0 1.5 Medium','v0-1.5-md','message',1,0.5,8,3,15,'/model-logos/vercel.svg',NULL,40),
('v0:v0-1.5-lg','v0','code','v0 1.5 Large','v0-1.5-lg','message',2,0.5,8,6,30,'/model-logos/vercel.svg','Pro',41),
('openrouter:gemini-omni','openrouter','chat','Gemini Omni','google/gemini-omni','message',1,NULL,NULL,1.25,5,'/model-logos/google.svg','New',50),
('openrouter:gemini-3-pro','openrouter','chat','Gemini 3 Pro','google/gemini-3-pro','message',2,NULL,NULL,2,12,'/model-logos/google.svg','Pro',51),
('openrouter:gpt-5','openrouter','chat','GPT-5','openai/gpt-5','message',2,NULL,NULL,1.25,10,'/model-logos/openai.svg',NULL,52),
('openrouter:claude-opus-4','openrouter','chat','Claude Opus 4','anthropic/claude-opus-4','message',5,NULL,NULL,15,75,'/model-logos/anthropic.svg','Premium',53)
ON CONFLICT (id) DO UPDATE SET
  label=EXCLUDED.label, endpoint=EXCLUDED.endpoint, credits_per_unit=EXCLUDED.credits_per_unit,
  in_price_per_m=EXCLUDED.in_price_per_m, out_price_per_m=EXCLUDED.out_price_per_m,
  min_credits=EXCLUDED.min_credits, max_credits=EXCLUDED.max_credits,
  icon=EXCLUDED.icon, badge=EXCLUDED.badge, sort_order=EXCLUDED.sort_order;