import {
  livePriceTarget,
  loadLivePrice,
} from "../../(creator)/_server/live-price";

import { readRefreshedProduct } from "../../(creator)/_server/product-refresh";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  const target = url && url.length <= 2048 ? livePriceTarget(url) : null;
  if (!target) return Response.json(null, { status: 400 });
  const live = loadLivePrice(target);
  const snapshot = readRefreshedProduct(target.url.href);
  const [current, product] = await Promise.all([live, snapshot]);
  const stored = product?.price ?? null;
  const price =
    current && (!stored || current.checkedAt >= stored.checkedAt)
      ? current
      : stored;
  return Response.json(
    params.get("metadata") === "1" ? { price, product } : price,
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
