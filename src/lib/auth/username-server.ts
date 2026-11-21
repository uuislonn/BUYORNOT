import "server-only";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "./config";

// Email resolution is restricted to the server; never return it to the browser.
export async function resolveUsername(
  username: string,
): Promise<string | null> {
  const config = authConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key) throw new Error("USERNAME_LOGIN_NOT_CONFIGURED");
  const client = createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc("username_login_email", {
    candidate: username.trim().toLowerCase(),
  });
  if (error) throw new Error("USERNAME_LOOKUP_FAILED");
  return typeof data === "string" ? data : null;
}
