"use client";

import { useEffect, useRef, useState } from "react";
import { PRICE_REFRESH_MS, type ProductUpdate } from "../_lib/live-price";
import { ProductPrice } from "./product-price";

export function useProductUpdate(url: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const [latest, setLatest] = useState<
    (ProductUpdate & { url: string }) | null
  >(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const controller = new AbortController();
    let visible = typeof IntersectionObserver === "undefined";
    let lastAttempt = 0;
    let pending = false;

    async function refresh() {
      if (
        !visible ||
        document.visibilityState === "hidden" ||
        pending ||
        Date.now() - lastAttempt < 30_000
      )
        return;
      pending = true;
      lastAttempt = Date.now();
      try {
        const response = await fetch(
          `/api/product-price?${new URLSearchParams({ url, metadata: "1" })}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) return;
        const result: ProductUpdate = await response.json();
        if (result && !controller.signal.aborted) setLatest({ ...result, url });
      } catch {
        // A transient request failure leaves the visible price in place.
      } finally {
        pending = false;
      }
    }

    const observer = visible
      ? null
      : new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          void refresh();
        });
    observer?.observe(element);
    void refresh();
    const interval = window.setInterval(refresh, PRICE_REFRESH_MS + 1000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      observer?.disconnect();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [url]);

  return { ref, latest: latest?.url === url ? latest : null };
}

export function LiveProductPrice({
  product,
}: {
  product: Parameters<typeof ProductPrice>[0]["product"] & { url: string };
}) {
  const { ref, latest } = useProductUpdate(product.url);
  return (
    <ProductPrice
      ref={ref}
      product={latest?.price ?? product}
      checkedAt={latest?.price?.checkedAt}
    />
  );
}
