-- ReviewFlow: Initial Schema
-- Run this in Supabase SQL Editor or via `supabase db push`

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  google_place_id text NOT NULL,
  website_url text NOT NULL,
  contact_page_url text NOT NULL,
  brand_color text NOT NULL DEFAULT '#2563EB',
  logo_url    text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_slug ON clients (slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REVIEW REQUESTS
-- ============================================================
CREATE TABLE review_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  customer_name   text NOT NULL,
  customer_email  text NOT NULL,
  token           text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'clicked')),
  sent_at         timestamptz,
  clicked_at      timestamptz,
  rating_clicked  smallint CHECK (rating_clicked BETWEEN 1 AND 5),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_requests_token ON review_requests (token);
CREATE INDEX idx_review_requests_client_id ON review_requests (client_id);

-- ============================================================
-- CLICK EVENTS
-- ============================================================
CREATE TABLE click_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id  uuid NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  rating             smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  redirected_to      text NOT NULL,
  user_agent         text,
  ip_address         text,
  clicked_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_events_review_request_id ON click_events (review_request_id);
CREATE INDEX idx_click_events_clicked_at ON click_events (clicked_at);

-- ============================================================
-- RLS: Permissive for anon (auth handled by Next.js middleware)
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for review_requests" ON review_requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for click_events" ON click_events
  FOR ALL USING (true) WITH CHECK (true);
