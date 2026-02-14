interface AcuityAppointment {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  calendarID: number;
  appointmentTypeID: number;
  canceled: boolean;
}

interface AcuityCalendar {
  id: number;
  name: string;
  email: string;
  replyTo: string;
  description: string;
  location: string;
  timezone: string;
}

interface GetAppointmentsParams {
  minDate: string; // YYYY-MM-DD
  maxDate: string;
  calendarID?: number;
}

const ACUITY_BASE = "https://acuityscheduling.com/api/v1";

function getAuthHeader(): string {
  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;
  if (!userId || !apiKey) {
    throw new Error("ACUITY_USER_ID and ACUITY_API_KEY must be set");
  }
  return "Basic " + Buffer.from(`${userId}:${apiKey}`).toString("base64");
}

async function acuityFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ACUITY_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Acuity API error ${res.status}: ${text}`);
  }

  return res.json();
}

export function isAcuityEnabled(): boolean {
  return process.env.ACUITY_ENABLED === "true";
}

export async function getCalendars(): Promise<AcuityCalendar[]> {
  return acuityFetch<AcuityCalendar[]>("/calendars");
}

export async function getAppointments({
  minDate,
  maxDate,
  calendarID,
}: GetAppointmentsParams): Promise<AcuityAppointment[]> {
  const allAppointments: AcuityAppointment[] = [];
  const pageSize = 100;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params: Record<string, string> = {
      minDate,
      maxDate,
      max: String(pageSize),
      page: String(page),
    };
    if (calendarID) {
      params.calendarID = String(calendarID);
    }

    const batch = await acuityFetch<AcuityAppointment[]>("/appointments", params);
    allAppointments.push(...batch);

    if (batch.length < pageSize) {
      hasMore = false;
    } else {
      page++;
      // Respect Acuity rate limit (10 req/s)
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Filter out canceled appointments
  return allAppointments.filter((a) => !a.canceled);
}

export type { AcuityAppointment, AcuityCalendar };
