import { cookies } from "next/headers";
import { getSetting } from "@/lib/settings";

const SESSION_COOKIE = "rf_session";
const SESSION_VALUE = "authenticated";

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = await getSetting("ADMIN_PASSWORD");
  return password === adminPassword;
}

export async function createSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
