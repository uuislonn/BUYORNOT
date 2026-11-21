// Run this on the app host with PRODUCT_REFRESH_SECRET set in its environment.
const secret = process.env.PRODUCT_REFRESH_SECRET;
if (!secret) throw new Error("PRODUCT_REFRESH_SECRET is required");
const endpoint = new URL(
  "/api/internal/product-refresh",
  process.env.PRODUCT_REFRESH_ORIGIN || "http://127.0.0.1:3000",
);
const deadline = Date.now() + 5 * 3600000;
let attempted = 0;
let refreshed = 0;
let done = false;
while (!done && Date.now() < deadline) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(150000),
  });
  if (!response.ok)
    throw new Error(`Product refresh failed (${response.status})`);
  const batch = await response.json();
  if (batch.busy) break;
  done = batch.done;
  attempted += batch.attempted;
  refreshed += batch.refreshed;
}
console.log({ attempted, refreshed, done });
