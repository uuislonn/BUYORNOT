begin;

alter table public.curation_posts
 drop constraint safe_product,
 add constraint safe_product check (
  jsonb_typeof(product) = 'object' and
  product ?& array['url','image','name','brand','category','currency','price'] and
  jsonb_typeof(product->'url') = 'string' and length(product->>'url') <= 2048 and
  (product->>'url') ~ '^https://((www[.])?(musinsa[.]com|29cm[.]co[.]kr|wconcept[.]co[.]kr)|www[.]oliveyoung[.]co[.]kr|product[.]29cm[.]co[.]kr)/' and
  jsonb_typeof(product->'image') = 'string' and length(product->>'image') <= 4096 and
  (product->>'image') ~ '^https://([a-zA-Z0-9-]+[.])*(msscdn[.]net|musinsa[.]com|29cm[.]co[.]kr|wconcept[.]co[.]kr|wconcept[.]com|oliveyoung[.]co[.]kr)/' and
  jsonb_typeof(product->'name') = 'string' and length(btrim(product->>'name')) between 1 and 100 and
  jsonb_typeof(product->'brand') = 'string' and length(btrim(product->>'brand')) between 1 and 50 and
  product->>'category' in ('의류','뷰티','신발','잡화','명품') and product->>'currency' = 'KRW' and
  (product->'price' = 'null'::jsonb or (jsonb_typeof(product->'price') = 'number' and (product->>'price')::numeric between 0 and 100000000)) and
  octet_length(product::text) < 10000
 );

commit;
