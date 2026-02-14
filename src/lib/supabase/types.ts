export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  google_place_id: string;
  website_url: string;
  contact_page_url: string;
  brand_color: string;
  logo_url: string | null;
  is_active: boolean;
  share_token: string | null;
  acuity_calendar_ids: number[];
  acuity_appointment_type_ids: number[];
  email_from_name: string | null;
  auto_send_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  client_id: string;
  name: string;
  google_place_id: string;
  contact_page_url: string;
  acuity_calendar_ids: number[];
  is_default: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  client_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  first_seen_at: string;
  source: string;
}

export interface ReviewRequest {
  id: string;
  client_id: string;
  customer_name: string;
  customer_email: string;
  token: string;
  status: "pending" | "sent" | "opened" | "clicked";
  sent_at: string | null;
  clicked_at: string | null;
  opened_at: string | null;
  rating_clicked: number | null;
  location_id: string | null;
  batch_id: string | null;
  source: string;
  created_at: string;
}

export interface ClickEvent {
  id: string;
  review_request_id: string;
  rating: number;
  redirected_to: string;
  user_agent: string | null;
  ip_address: string | null;
  clicked_at: string;
}

export interface EmailOpen {
  id: string;
  review_request_id: string;
  opened_at: string;
}

export interface SendBatch {
  id: string;
  client_id: string;
  week_start: string;
  week_end: string;
  total_new: number;
  total_sent: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface ReviewRequestWithClient extends ReviewRequest {
  clients: Client;
}

export interface ReviewRequestWithClientAndLocation extends ReviewRequest {
  clients: Client;
  locations: Location | null;
}
