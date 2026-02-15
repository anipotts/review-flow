-- ============================================================
-- SEED: Providers for all 3 medical practice clients
-- ============================================================
-- Providers with their own Google Business Profile get a
-- google_place_id. Others use NULL (falls back to client/location).
--
-- TODO: MANUAL COMPLETION REQUIRED
-- The following providers need their Google Place IDs looked up:
--   [ ] Dr. Hina T. Gupta (ENT) — individual GMB
--   [ ] Dr. Charles J. Zeller IV (ENT) — individual GMB
--   [ ] Dr. Kush H. Tripathi (IPWC) — individual GMB
--   [ ] Dr. Marc S. Cohen (IPWC) — individual GMB
-- ============================================================

-- Sachedina Urology providers
-- Both doctors share the clinic's GMB (google_place_id = NULL)
INSERT INTO providers (client_id, name, display_name, google_place_id, npi)
VALUES
  ((SELECT id FROM clients WHERE slug = 'sachedina-urology'),
   'Dr. Azeem M. Sachedina, MD', 'Dr. Sachedina', NULL, '1629060876'),
  ((SELECT id FROM clients WHERE slug = 'sachedina-urology'),
   'Dr. Nasheer A. Sachedina, MD', 'Dr. Sachedina', NULL, '1477788974');

-- ENT Specialty Center providers
INSERT INTO providers (client_id, name, display_name, google_place_id, npi)
VALUES
  ((SELECT id FROM clients WHERE slug = 'ent-specialty-center'),
   'Dr. Hina T. Gupta, MD', 'Dr. Gupta', 'PLACEHOLDER_NEEDS_LOOKUP', '1659580066'),
  ((SELECT id FROM clients WHERE slug = 'ent-specialty-center'),
   'Dr. Charles J. Zeller IV, DO', 'Dr. Zeller', 'PLACEHOLDER_NEEDS_LOOKUP', '1720086366'),
  ((SELECT id FROM clients WHERE slug = 'ent-specialty-center'),
   'Dr. Marifran Ramaglia, Au.D.', 'Dr. Ramaglia', NULL, '1821198292');

-- IPWC Broward providers
INSERT INTO providers (client_id, name, display_name, google_place_id, npi)
VALUES
  ((SELECT id FROM clients WHERE slug = 'ipwc-broward'),
   'Dr. Kush H. Tripathi, MD', 'Dr. Tripathi', 'PLACEHOLDER_NEEDS_LOOKUP', '1689916975'),
  ((SELECT id FROM clients WHERE slug = 'ipwc-broward'),
   'Dr. Marc S. Cohen, MD', 'Dr. Cohen', 'PLACEHOLDER_NEEDS_LOOKUP', '1518300839'),
  ((SELECT id FROM clients WHERE slug = 'ipwc-broward'),
   'Dr. Rebecca Tamarkin, DO', 'Dr. Tamarkin', NULL, '1437655727'),
  ((SELECT id FROM clients WHERE slug = 'ipwc-broward'),
   'Dr. Rekhaben R. Suthar, MD', 'Dr. Suthar', NULL, '1467866780');
