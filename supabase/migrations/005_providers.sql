-- ============================================================
-- PROVIDERS: Individual doctors/practitioners per client
-- ============================================================
-- Enables per-doctor Google review routing and personalized emails.
-- When a review request has a provider, the email says
-- "How was your experience with Dr. X at Clinic Y?"
-- and 5-star clicks route to the doctor's own Google review page.

CREATE TABLE providers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name            text NOT NULL,           -- Full name: "Dr. Hina T. Gupta, MD"
  display_name    text NOT NULL,           -- Shown in emails: "Dr. Gupta"
  google_place_id text,                    -- Doctor's own GMB place ID (NULL = use client/location)
  npi             text,                    -- National Provider Identifier
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_client_id ON providers (client_id);

-- ============================================================
-- Add provider_id to review_requests
-- ============================================================
-- Nullable: existing requests and requests without a specific
-- doctor continue to work with the client-level fallback.

ALTER TABLE review_requests
  ADD COLUMN provider_id uuid REFERENCES providers(id) ON DELETE SET NULL;

CREATE INDEX idx_review_requests_provider_id ON review_requests (provider_id);

-- ============================================================
-- RLS (permissive, auth handled by Next.js middleware)
-- ============================================================

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for providers" ON providers
  FOR ALL USING (true) WITH CHECK (true);
