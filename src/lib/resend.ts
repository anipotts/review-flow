import { Resend } from "resend";
import { getSetting } from "@/lib/settings";

let _resend: Resend | null = null;
let _lastKey: string | undefined;

export async function getResend(): Promise<Resend> {
  const key = await getSetting("RESEND_API_KEY");
  if (!_resend || key !== _lastKey) {
    _resend = new Resend(key);
    _lastKey = key;
  }
  return _resend;
}
