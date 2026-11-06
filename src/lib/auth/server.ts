import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfig } from "./config";
export async function authClient() {
  const config = authConfig();
  if (!config) throw new Error("AUTH_NOT_CONFIGURED");
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies; proxy refreshes them. */
        }
      },
    },
  });
}
export async function currentUser() {
  if (!authConfig()) return null;
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}
