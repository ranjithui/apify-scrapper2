-- =====================================================================
-- Seed data: Apify provider + example interchangeable actors.
-- Run AFTER schema.sql.  actor_ref values are real public Apify actors;
-- adjust priorities / status to taste. Priority 1 = active.
-- =====================================================================

-- Provider ---------------------------------------------------------------
insert into public.providers (key, name, type, enabled, config)
values ('apify', 'Apify Platform', 'scraper', true, '{"base_url":"https://api.apify.com/v2"}'::jsonb)
on conflict (key) do nothing;

-- Adapters (source bindings) --------------------------------------------
insert into public.adapters (provider_id, source, name, enabled)
select p.id, s.source, s.name, true
from public.providers p
cross join (values
  ('apollo',      'Apollo Adapter'),
  ('linkedin',    'LinkedIn Adapter'),
  ('google_maps', 'Google Maps Adapter'),
  ('website',     'Website Contact Adapter')
) as s(source, name)
where p.key = 'apify'
on conflict do nothing;

-- Actors: Google Maps (Apollo/LinkedIn refs are placeholders you can edit) --
with apify as (select id from public.providers where key = 'apify')
insert into public.actors
  (provider_id, source, name, actor_ref, priority, status, input_schema, output_mapping, default_input)
values
  -- Google Maps: two interchangeable actors, A active / B standby
  ((select id from apify), 'google_maps', 'Google Maps Scraper (A)',
   'compass/crawler-google-places', 1, 'active',
   '{"searchStringsArray":"{{keyword}}","locationQuery":"{{city}} {{country}}","maxCrawledPlacesPerSearch":"{{limit}}"}'::jsonb,
   '{"first_name":"","last_name":"","company":"title","phone":"phone","website":"website","country":"countryCode","industry":"categoryName","email":"email","raw":"@"}'::jsonb,
   '{"maxCrawledPlacesPerSearch":50,"language":"en"}'::jsonb),

  ((select id from apify), 'google_maps', 'Google Maps Scraper (B)',
   'lukaskrivka/google-maps-with-contact-details', 2, 'standby',
   '{"searchStringsArray":"{{keyword}}","locationQuery":"{{city}} {{country}}","maxCrawledPlaces":"{{limit}}"}'::jsonb,
   '{"company":"title","phone":"phone","website":"website","email":"emails.0","linkedin":"linkedIns.0","industry":"categoryName","raw":"@"}'::jsonb,
   '{"maxCrawledPlaces":50}'::jsonb),

  -- Apollo: placeholder refs (replace with your licensed actor)
  ((select id from apify), 'apollo', 'Apollo Actor A',
   'your-org/apollo-scraper-a', 1, 'active',
   '{"query":"{{keyword}}","industry":"{{industry}}","country":"{{country}}","limit":"{{limit}}"}'::jsonb,
   '{"first_name":"first_name","last_name":"last_name","title":"title","company":"organization_name","email":"email","phone":"phone","linkedin":"linkedin_url","industry":"industry","country":"country","employee_count":"employees","revenue":"revenue","raw":"@"}'::jsonb,
   '{"limit":100}'::jsonb),

  ((select id from apify), 'apollo', 'Apollo Actor B',
   'your-org/apollo-scraper-b', 2, 'standby',
   '{"keywords":"{{keyword}}","industries":"{{industry}}","locations":"{{country}}"}'::jsonb,
   '{"first_name":"firstName","last_name":"lastName","title":"jobTitle","company":"companyName","email":"emailAddress","linkedin":"linkedinUrl","raw":"@"}'::jsonb,
   '{}'::jsonb),

  -- LinkedIn: placeholder
  ((select id from apify), 'linkedin', 'LinkedIn Company Scraper',
   'your-org/linkedin-scraper', 1, 'active',
   '{"searchUrl":"{{linkedin_url}}","keyword":"{{keyword}}","limit":"{{limit}}"}'::jsonb,
   '{"first_name":"firstName","last_name":"lastName","title":"title","company":"companyName","linkedin":"profileUrl","industry":"industry","country":"location","raw":"@"}'::jsonb,
   '{}'::jsonb)
on conflict do nothing;

-- Settings --------------------------------------------------------------
insert into public.settings (key, value) values
  ('failover_enabled', 'false'::jsonb),
  ('default_lead_limit', '50'::jsonb),
  ('min_confidence_to_store', '0.0'::jsonb)
on conflict (key) do nothing;
