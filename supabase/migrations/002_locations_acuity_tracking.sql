-- MaMaDigital: Multi-location, Acuity integration, open tracking
-- Phase 1 migration

-- ============================================================
-- LOCATIONS (multi-location support per client)
-- ============================================================
CREATE TABLE locations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name                text NOT NULL,
  google_place_id     text NOT NULL,
  contact_page_url    text NOT NULL,
  acuity_calendar_ids integer[] DEFAULT '{}',
  is_default          boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_client_id ON locations (client_id);

-- ============================================================
-- PATIENTS (first-time detection via UNIQUE constraint)
-- ============================================================
CREATE TABLE patients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email         text NOT NULL,
  first_name    text,
  last_name     text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  source        text NOT NULL DEFAULT 'manual',
  UNIQUE (client_id, email)
);

CREATE INDEX idx_patients_client_id ON patients (client_id);

-- ============================================================
-- EMAIL OPENS (tracking pixel events)
-- ============================================================
CREATE TABLE email_opens (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id uuid NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  opened_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_opens_review_request_id ON email_opens (review_request_id);

-- ============================================================
-- SEND BATCHES (groups automated weekly sends)
-- ============================================================
CREATE TABLE send_batches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_start   date NOT NULL,
  week_end     date NOT NULL,
  total_new    integer NOT NULL DEFAULT 0,
  total_sent   integer NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_send_batches_client_id ON send_batches (client_id);

-- ============================================================
-- ALTER CLIENTS: add share_token, acuity fields, email_from_name
-- ============================================================
ALTER TABLE clients ADD COLUMN share_token text UNIQUE;
ALTER TABLE clients ADD COLUMN acuity_calendar_ids integer[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN email_from_name text;
ALTER TABLE clients ADD COLUMN auto_send_enabled boolean NOT NULL DEFAULT false;

-- ============================================================
-- ALTER REVIEW REQUESTS: add location, open tracking, batch, source
-- ============================================================
ALTER TABLE review_requests ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE review_requests ADD COLUMN opened_at timestamptz;
ALTER TABLE review_requests ADD COLUMN batch_id uuid REFERENCES send_batches(id) ON DELETE SET NULL;
ALTER TABLE review_requests ADD COLUMN source text NOT NULL DEFAULT 'manual';

-- Update status CHECK to include 'opened'
ALTER TABLE review_requests DROP CONSTRAINT review_requests_status_check;
ALTER TABLE review_requests ADD CONSTRAINT review_requests_status_check
  CHECK (status IN ('pending', 'sent', 'opened', 'clicked'));

-- ============================================================
-- RLS for new tables
-- ============================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for locations" ON locations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for patients" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for email_opens" ON email_opens
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for send_batches" ON send_batches
  FOR ALL USING (true) WITH CHECK (true);
