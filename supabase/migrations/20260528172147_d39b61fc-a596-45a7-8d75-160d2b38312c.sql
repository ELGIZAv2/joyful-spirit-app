UPDATE public.fal_image_models SET is_active = false WHERE provider = 'fal';
UPDATE public.fal_video_models SET is_active = false WHERE provider = 'fal';

INSERT INTO public.fal_image_models (
  slug, display_name, provider, description, endpoint_text_to_image, endpoint_image_to_image,
  unit, fal_unit_cost_usd, credits, supports_multi_image, max_input_images,
  supported_aspects, supported_resolutions, default_aspect, default_resolution,
  is_premium, is_new, is_featured, sort_order, is_active
) VALUES
('leonardo-phoenix-1.0','Leonardo Phoenix 1.0','leonardo','High-quality photoreal','de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3','de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3','image',0.012,4,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K","2K"]','1:1','1K',true,true,true,1,true),
('leonardo-phoenix-0.9','Leonardo Phoenix 0.9','leonardo','Phoenix preview','6b645e3a-d64f-4341-a6d8-7a3690fbf042','6b645e3a-d64f-4341-a6d8-7a3690fbf042','image',0.010,3,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,false,false,2,true),
('leonardo-flux-dev','Flux Dev (Leonardo)','leonardo','Flux Dev via Leonardo','b2614463-296c-462a-9586-aafdb8f00e36','b2614463-296c-462a-9586-aafdb8f00e36','image',0.014,4,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K","2K"]','1:1','1K',true,true,true,3,true),
('leonardo-flux-schnell','Flux Schnell (Leonardo)','leonardo','Fast Flux','1dd50843-d653-4516-a8e3-f0238ee453ff','1dd50843-d653-4516-a8e3-f0238ee453ff','image',0.006,2,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,true,true,4,true),
('leonardo-lucid-realism','Lucid Realism','leonardo','Hyper-real portraits','05ce0082-2d80-4a2d-8653-4d1c85e2418e','05ce0082-2d80-4a2d-8653-4d1c85e2418e','image',0.012,4,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K","2K"]','1:1','1K',true,false,true,5,true),
('leonardo-anime-xl','Leonardo Anime XL','leonardo','Anime style','e71a1c2f-4f80-4800-934f-2c68979d8cc8','e71a1c2f-4f80-4800-934f-2c68979d8cc8','image',0.008,3,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,false,false,6,true),
('leonardo-kino-xl','Leonardo Kino XL','leonardo','Cinematic','aa77f04e-3eec-4034-9c07-d0f619684628','aa77f04e-3eec-4034-9c07-d0f619684628','image',0.010,3,false,1,'["16:9","21:9","1:1","9:16"]','["1K","2K"]','16:9','1K',true,false,true,7,true),
('leonardo-vision-xl','Leonardo Vision XL','leonardo','Photoreal vision','5c232a9e-9061-4777-980a-ddc8e65647c6','5c232a9e-9061-4777-980a-ddc8e65647c6','image',0.008,3,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,false,false,8,true),
('leonardo-lightning-xl','Leonardo Lightning XL','leonardo','Fast SDXL','b24e16ff-06e3-43eb-8d33-4416c2d75876','b24e16ff-06e3-43eb-8d33-4416c2d75876','image',0.005,2,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,false,false,9,true),
('leonardo-diffusion-xl','Leonardo Diffusion XL','leonardo','Default Leonardo SDXL','1e60896f-3c26-4296-8ecc-53e2afecc132','1e60896f-3c26-4296-8ecc-53e2afecc132','image',0.006,2,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,false,false,10,true),
('leonardo-albedo-xl','AlbedoBase XL','leonardo','General purpose XL','2067ae52-33fd-4a82-bb92-c2c55e7d2786','2067ae52-33fd-4a82-bb92-c2c55e7d2786','image',0.006,2,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,false,false,11,true),
('qwen-image-plus','Qwen Image Plus','alibaba','Qwen-Image HQ','qwen-image-plus','qwen-image-plus','image',0.020,5,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K","2K"]','1:1','1K',true,true,true,20,true),
('wanx2.1-t2i-turbo','Wanx 2.1 Turbo','alibaba','Alibaba fast t2i','wanx2.1-t2i-turbo','wanx2.1-t2i-turbo','image',0.008,2,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K"]','1:1','1K',false,true,false,21,true),
('wanx2.1-t2i-plus','Wanx 2.1 Plus','alibaba','Alibaba HQ t2i','wanx2.1-t2i-plus','wanx2.1-t2i-plus','image',0.015,4,false,1,'["1:1","16:9","9:16","4:3","3:4"]','["1K","2K"]','1:1','1K',true,true,true,22,true)
ON CONFLICT (slug) DO UPDATE SET
  is_active=true, provider=EXCLUDED.provider,
  endpoint_text_to_image=EXCLUDED.endpoint_text_to_image,
  endpoint_image_to_image=EXCLUDED.endpoint_image_to_image;

INSERT INTO public.fal_video_models (
  slug, display_name, provider, description, endpoint_text_to_video, endpoint_image_to_video,
  unit, cost_per_video_usd, credits_per_video, supports_multi_image, max_input_images,
  supports_start_end_frame, supports_audio,
  supported_aspects, supported_resolutions, supported_durations,
  default_aspect, default_resolution, default_duration,
  is_premium, is_new, is_featured, sort_order, is_active
) VALUES
('leonardo-motion-svd','Leonardo Motion','leonardo','Image-to-video via Leonardo',NULL,'motion-svd','video',0.25,25,false,1,false,false,'["16:9","9:16","1:1"]','["720p"]','[5]','16:9','720p',5,true,true,true,1,true),
('wanx2.1-i2v-turbo','Wan 2.1 I2V Turbo','alibaba','Image-to-video fast',NULL,'wanx2.1-i2v-turbo','video',0.35,35,false,1,false,false,'["16:9","9:16","1:1"]','["720p","1080p"]','[5]','16:9','720p',5,true,true,true,10,true),
('wanx2.1-i2v-plus','Wan 2.1 I2V Plus','alibaba','Image-to-video HQ',NULL,'wanx2.1-i2v-plus','video',0.50,50,false,1,false,false,'["16:9","9:16","1:1"]','["720p","1080p"]','[5]','16:9','720p',5,true,true,true,11,true),
('wanx2.1-t2v-turbo','Wan 2.1 T2V Turbo','alibaba','Text-to-video fast','wanx2.1-t2v-turbo',NULL,'video',0.30,30,false,0,false,false,'["16:9","9:16","1:1"]','["720p"]','[5]','16:9','720p',5,false,true,false,12,true)
ON CONFLICT (slug) DO UPDATE SET
  is_active=true, provider=EXCLUDED.provider,
  endpoint_text_to_video=EXCLUDED.endpoint_text_to_video,
  endpoint_image_to_video=EXCLUDED.endpoint_image_to_video;