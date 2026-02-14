-- MaMaDigital: Seed data for 3 medical practice clients
-- Pre-fills clients + locations with verified data from deep research
--
-- ============================================================
-- TODO: MANUAL COMPLETION REQUIRED
-- ============================================================
-- The following fields use placeholder values and MUST be updated:
--
-- GOOGLE PLACE IDs (10 total — use https://developers.google.com/maps/documentation/places/web-service/place-id):
--   [ ] Sachedina Urology (client + Coral Springs location)
--   [ ] ENT Specialty Center (client + Coconut Creek location)
--   [ ] ENT Specialty Center — Pompano Beach location
--   [ ] ENT Specialty Center — Delray Beach location
--   [ ] IPWC Broward (client + Coconut Creek location)
--   [ ] IPWC Broward — Pompano Beach location
--   [ ] IPWC Broward — Delray Beach location
--
-- BRAND COLORS:
--   [ ] ENT Specialty Center — currently using default #2563EB
--   [ ] IPWC Broward — currently using default #2563EB
--
-- LOGO URLs:
--   [ ] Sachedina Urology — download from sachedinaurology.com, upload to Supabase Storage
--   [ ] ENT Specialty Center — download from entbroward.com, upload to Supabase Storage
--   [ ] IPWC Broward — download from ipwcbroward.com, upload to Supabase Storage
--
-- ACUITY (when credentials are available):
--   [ ] ENT Specialty Center — acuity_calendar_ids + acuity_appointment_type_ids (uses entbroward.as.me)
--   [ ] IPWC Broward — confirm if using Acuity or website form only
-- ============================================================

-- ============================================================
-- CLIENT 1: Sachedina Urology
-- ============================================================
-- Website: https://www.sachedinaurology.com
-- Providers: Dr. Azeem M. Sachedina, MD (NPI: 1629060876)
--            Dr. Nasheer A. Sachedina, MD (NPI: 1477788974)
-- Specialty: Urology — Robotic & Minimally Invasive Surgery, AQUABLATION, Rezum
-- Location: 1670 N University Dr, Suite A, Coral Springs, FL 33071
-- Phone: (954) 227-6747 | Fax: (954) 227-6783
-- Hours: Mon-Fri 8:00 AM - 5:00 PM
-- Online Booking: ZocDoc (not Acuity)
-- Reviews: Zocdoc 4.65/5 (146 reviews, Dr. Nasheer), Vitals 4.4/5 (82 ratings)

INSERT INTO clients (name, slug, google_place_id, website_url, contact_page_url, brand_color, logo_url, is_active, email_from_name, auto_send_enabled)
VALUES (
  'Sachedina Urology',
  'sachedina-urology',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: Google Place ID for 1670 N University Dr, Coral Springs
  'https://www.sachedinaurology.com',
  'https://www.sachedinaurology.com/contact',
  '#1B3A8C',  -- Blue from logo
  NULL,       -- TODO: Upload logo to Supabase Storage
  true,
  'Sachedina Urology',
  false
);

-- ============================================================
-- CLIENT 2: ENT Specialty Center
-- ============================================================
-- Website: https://www.entbroward.com
-- Legal Entity: ENT Medical Specialist, P.A.
-- Providers: Dr. Hina T. Gupta, MD (NPI: 1659580066)
--            Dr. Charles J. Zeller IV, DO (NPI: 1720086366)
--            Dr. Marifran Ramaglia, Au.D. (NPI: 1821198292)
-- Specialty: Otolaryngology, Facial Plastic Surgery, Audiology
-- 3 Locations: Coconut Creek, Pompano Beach, Delray Beach
-- Main Phone: (954) 943-1418 | Text: (954) 635-5465 | Fax: (954) 532-7728
-- Hours: Mon-Fri 8:30 AM - 5:00 PM
-- Online Booking: Acuity Scheduling (entbroward.as.me) — COMPATIBLE with project webhooks
-- Reviews: Zocdoc 4.42/5 (33 reviews, Dr. Gupta)
-- Note: Shares all 3 locations with IPWC (Broward Specialty Group umbrella)

INSERT INTO clients (name, slug, google_place_id, website_url, contact_page_url, brand_color, logo_url, is_active, email_from_name, auto_send_enabled)
VALUES (
  'ENT Specialty Center',
  'ent-specialty-center',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: Google Place ID for Coconut Creek office
  'https://www.entbroward.com',
  'https://www.entbroward.com/contact',
  '#2563EB',  -- TODO: Sample actual brand color from entbroward.com
  NULL,       -- TODO: Upload logo to Supabase Storage
  true,
  'ENT Specialty Center',
  false
);

-- ============================================================
-- CLIENT 3: Interventional Pain & Wellness Center (IPWC)
-- ============================================================
-- Website: https://www.ipwcbroward.com
-- Providers: Dr. Kush H. Tripathi, MD (NPI: 1689916975)
--            Dr. Marc S. Cohen, MD (NPI: 1518300839)
--            Dr. Rebecca Tamarkin, DO (NPI: 1437655727)
--            Dr. Rekhaben R. Suthar, MD (NPI: 1467866780)
-- Specialty: Interventional Pain Management, Anesthesiology
-- Founded: August 2018
-- 3 Locations: Same as ENT — Coconut Creek, Pompano Beach, Delray Beach
-- Main Phone: (954) 633-2397 | Text: (954) 368-0681 | Fax: (954) 783-6845
-- Email: ipwcbrowardma@gmail.com
-- Hours: Mon-Fri 8:30 AM - 5:00 PM
-- Online Booking: Website form (Acuity not confirmed)
-- Reviews: Yelp 2.5/5 (6 reviews), Birdeye 4.4/5 (14 reviews)
-- Social: Facebook @IPWC.Broward, Instagram @ipwc.broward (310 followers)

INSERT INTO clients (name, slug, google_place_id, website_url, contact_page_url, brand_color, logo_url, is_active, email_from_name, auto_send_enabled)
VALUES (
  'Interventional Pain & Wellness Center',
  'ipwc-broward',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: Google Place ID for Coconut Creek office
  'https://www.ipwcbroward.com',
  'https://www.ipwcbroward.com/contact',
  '#2563EB',  -- TODO: Sample actual brand color from ipwcbroward.com
  NULL,       -- TODO: Upload logo to Supabase Storage
  true,
  'IPWC Broward',
  false
);

-- ============================================================
-- LOCATIONS: Sachedina Urology (1 location)
-- ============================================================

INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'sachedina-urology'),
  'Coral Springs',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 1670 N University Dr, Suite A, Coral Springs, FL 33071
  'https://www.sachedinaurology.com/contact',
  true
);

-- ============================================================
-- LOCATIONS: ENT Specialty Center (3 locations)
-- ============================================================

-- Coconut Creek (default/main office)
-- Address: 4515 Wiles Rd, Suite 201A, Coconut Creek, FL 33073
-- Phone: (954) 943-1418
INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'ent-specialty-center'),
  'Coconut Creek',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 4515 Wiles Rd, Suite 201A, Coconut Creek, FL 33073
  'https://www.entbroward.com/contact',
  true
);

-- Pompano Beach
-- Address: 601 E Sample Rd, Suite 105, Pompano Beach, FL 33064
INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'ent-specialty-center'),
  'Pompano Beach',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 601 E Sample Rd, Suite 105, Pompano Beach, FL 33064
  'https://www.entbroward.com/contact',
  false
);

-- Delray Beach
-- Address: 13722 S Jog Rd, Suite A, Delray Beach, FL 33484
INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'ent-specialty-center'),
  'Delray Beach',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 13722 S Jog Rd, Suite A, Delray Beach, FL 33484
  'https://www.entbroward.com/contact',
  false
);

-- ============================================================
-- LOCATIONS: IPWC Broward (3 locations — same addresses as ENT)
-- ============================================================

-- Coconut Creek (default)
-- Address: 4515 Wiles Rd, Suite 201A, Coconut Creek, FL 33073
-- Phone: (954) 368-0681
INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'ipwc-broward'),
  'Coconut Creek',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 4515 Wiles Rd, Suite 201A, Coconut Creek, FL 33073
  'https://www.ipwcbroward.com/contact',
  true
);

-- Pompano Beach
-- Address: 601 E Sample Rd, Suite 105, Pompano Beach, FL 33064
-- Phone: (954) 633-2397
INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'ipwc-broward'),
  'Pompano Beach',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 601 E Sample Rd, Suite 105, Pompano Beach, FL 33064
  'https://www.ipwcbroward.com/contact',
  false
);

-- Delray Beach
-- Address: 13722 S Jog Rd, Suite A, Delray Beach, FL 33446
-- Phone: (954) 633-2397
INSERT INTO locations (client_id, name, google_place_id, contact_page_url, is_default)
VALUES (
  (SELECT id FROM clients WHERE slug = 'ipwc-broward'),
  'Delray Beach',
  'PLACEHOLDER_NEEDS_LOOKUP',  -- TODO: 13722 S Jog Rd, Suite A, Delray Beach, FL 33446
  'https://www.ipwcbroward.com/contact',
  false
);
