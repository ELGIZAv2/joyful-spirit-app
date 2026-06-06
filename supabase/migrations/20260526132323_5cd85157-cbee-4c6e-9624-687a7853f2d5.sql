CREATE TABLE public.dodo_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier TEXT NOT NULL CHECK (tier IN ('starter','pro','elite','business')),
  interval TEXT NOT NULL CHECK (interval IN ('monthly','yearly')),
  product_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tier, interval)
);

GRANT SELECT ON public.dodo_products TO anon;
GRANT SELECT ON public.dodo_products TO authenticated;
GRANT ALL ON public.dodo_products TO service_role;

ALTER TABLE public.dodo_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active dodo products"
ON public.dodo_products
FOR SELECT
USING (active = true);

CREATE TRIGGER update_dodo_products_updated_at
BEFORE UPDATE ON public.dodo_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.dodo_products (tier, interval, product_id) VALUES
  ('starter','monthly','pdt_0NfOHJoiT8SDfibwKrYkd'),
  ('starter','yearly','pdt_0NfOI5bIL4ENBrcV8JEvM'),
  ('pro','monthly','pdt_0NfOIP9Cjs7MnsYwuOHA5'),
  ('pro','yearly','pdt_0NfOIbGR12Bk6zmVhIfho'),
  ('elite','monthly','pdt_0NfOIsOWsAjKTv5MycEUK'),
  ('elite','yearly','pdt_0NfOJ0bn0DYGJudz1v5dO'),
  ('business','monthly','pdt_0NfOJ8SCeVWcmpoJtiHaX'),
  ('business','yearly','pdt_0NfOJHY75Ky5FtnhU3ZPL')
ON CONFLICT (tier, interval) DO NOTHING;