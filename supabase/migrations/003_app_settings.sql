-- MaMaDigital: App settings table + client appointment type filtering

-- ============================================================
-- APP SETTINGS (runtime config, avoids env var redeploys)
-- ============================================================
CREATE TABLE app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for app_settings" ON app_settings
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- CLIENTS: add appointment type filtering
-- ============================================================
ALTER TABLE clients ADD COLUMN acuity_appointment_type_ids integer[] DEFAULT '{}';
