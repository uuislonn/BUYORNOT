import { createHash, timingSafeEqual } from "node:crypto";
import { runProductRefreshBatch } from "../../../(creator)/_server/product-refresh";

export const maxDuration = 150;
const hash = (value: string) => createHash("sha256").update(value).digest();

export async function POST(request: Request) {
  const secret = process.env.PRODUCT_REFRESH_SECRET;
  if (
    !secret ||
    !timingSafeEqual(
      hash(request.headers.get("authorization") ?? ""),
      hash(`Bearer ${secret}`),
    )
  )
    return new Response(null, { status: 401 });

  return Response.json(await runProductRefreshBatch());
}
