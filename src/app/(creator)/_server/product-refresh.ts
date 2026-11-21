import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { store } from "../../../features/community/store";
import { fetchProductHtml } from "../../../features/community/product-fetch";
import { parseProductMetadata } from "../../../features/community/product-metadata";
import { authConfig } from "../../../lib/auth/config";
import {
  localTestDatabase,
  localTestEnabled,
} from "../../../lib/auth/local-test";
import type { RefreshedProduct } from "../_lib/live-price";
import { livePriceTarget } from "./live-price";
import { parseLiveProductPricing } from "./product-metadata";

type RegisteredProduct = { url: string; date: string; views: number };
type Progress = { day: number; offset: number; done: boolean };
const folder = () =>
  process.env.PRODUCT_REFRESH_DATA_DIR ||
  join(process.cwd(), ".data", "product-refresh");
const hash = (url: string) => createHash("sha256").update(url).digest("hex");
const dayInKorea = (now: number) => Math.floor((now + 9 * 3600000) / 86400000);

export function refreshQueue(posts: Iterable<RegisteredProduct>, now: number) {
  const selected = new Map<string, boolean>();
  const day = dayInKorea(now);
  for (const post of posts) {
    const target = livePriceTarget(post.url);
    if (!target || target.official) continue;
    const url = target.url.href;
    const priority =
      now - Date.parse(post.date) <= 14 * 86400000 || post.views >= 100;
    if (priority || parseInt(hash(url).slice(0, 8), 16) % 3 === day % 3)
      selected.set(url, priority || (selected.get(url) ?? false));
  }
  return [...selected]
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([url]) => url);
}

async function registeredProducts() {
  const products: RegisteredProduct[] = [];
  for (const post of store.posts.values()) {
    if (!post.deletedAt && post.visibility === "PUBLIC")
      products.push({
        url: post.product.url,
        date: post.createdAt,
        views: post.views ?? 0,
      });
  }
  if (localTestEnabled()) {
    for (const post of localTestDatabase().requests)
      products.push({
        url: post.product.url,
        date: post.createdAt,
        views: store.curationViewCount(post.creatorId, post.id),
      });
  }
  const auth = authConfig();
  if (!auth) return products;
  const client = createClient(auth.url, auth.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let after: string | undefined;
  for (;;) {
    const query = client
      .from("curation_posts")
      .select("id,product,created_at,creator_id")
      .order("id")
      .limit(500);
    const { data, error } = await (after ? query.gt("id", after) : query);
    if (error) throw new Error("Could not list registered curation products");
    for (const row of data) {
      if (typeof row.product?.url === "string")
        products.push({
          url: row.product.url,
          date: row.created_at,
          views: store.curationViewCount(row.creator_id, row.id),
        });
    }
    if (data.length < 500) return products;
    after = data.at(-1)?.id;
  }
}

async function atomicWrite(path: string, data: string) {
  const temporary = path + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temporary, data, { mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}
async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
}

function snapshotPath(url: string) {
  const key = hash(url);
  return join(folder(), "products", key.slice(0, 2), key + ".json");
}

export async function readRefreshedProduct(url: string) {
  return readJson<RefreshedProduct>(snapshotPath(url));
}

async function refresh(url: string) {
  const target = livePriceTarget(url);
  if (!target) return false;
  let html;
  let product;
  try {
    const page = await fetchProductHtml(url, undefined, target.validate);
    html = page.html;
    product = parseProductMetadata(html, page.url, true);
  } catch {
    return false;
  }
  const pricing = parseLiveProductPricing(html);
  const previous = await readRefreshedProduct(url);
  const checkedAt = new Date().toISOString();
  const snapshot: RefreshedProduct = {
    name: product.name,
    ...(product.brand || previous?.brand
      ? { brand: product.brand || previous?.brand }
      : {}),
    image: product.image,
    price:
      pricing.price === null
        ? (previous?.price ?? null)
        : { ...pricing, price: pricing.price, checkedAt },
  };
  const path = snapshotPath(url);
  await mkdir(join(path, ".."), { recursive: true });
  await atomicWrite(path, JSON.stringify(snapshot));
  return true;
}

async function readBatch(path: string, offset: number) {
  const file = await open(path, "r");
  try {
    const buffer = Buffer.alloc(64 * 1024);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, offset);
    const lines = buffer.subarray(0, bytesRead).toString("utf8").split("\n");
    lines.pop();
    return lines.slice(0, 12);
  } finally {
    await file.close();
  }
}

const globalJob = globalThis as typeof globalThis & {
  buyornotProductRefreshActive?: boolean;
};

export async function runProductRefreshBatch(now = Date.now()) {
  if (globalJob.buyornotProductRefreshActive) return { busy: true as const };
  globalJob.buyornotProductRefreshActive = true;
  try {
    await mkdir(folder(), { recursive: true });
    const queuePath = join(folder(), "queue.txt");
    const progressPath = join(folder(), "progress.json");
    const day = dayInKorea(now);
    let state = await readJson<Progress>(progressPath);
    if (!state || (state.done && state.day !== day)) {
      const queue = refreshQueue(await registeredProducts(), now);
      await atomicWrite(queuePath, queue.length ? queue.join("\n") + "\n" : "");
      state = { day, offset: 0, done: false };
      await atomicWrite(progressPath, JSON.stringify(state));
    }
    if (state.done) return { done: true, refreshed: 0, attempted: 0 };

    const urls = await readBatch(queuePath, state.offset);
    const byHost = Map.groupBy(urls, (url) => new URL(url).hostname);
    const counts = await Promise.all(
      [...byHost.values()].map(async (group) => {
        let next = 0;
        let nextStart = Date.now();
        async function worker() {
          let refreshed = 0;
          while (next < group.length) {
            const url = group[next++];
            const wait = Math.max(0, nextStart - Date.now());
            nextStart = Date.now() + wait + 650;
            if (wait) await delay(wait);
            if (await refresh(url)) refreshed++;
          }
          return refreshed;
        }
        const totals = await Promise.all(group.slice(0, 3).map(() => worker()));
        return totals.reduce((sum, value) => sum + value, 0);
      }),
    );
    // Maintain the host interval across batch boundaries.
    if (urls.length) await delay(650);
    state.offset += urls.reduce(
      (sum, url) => sum + Buffer.byteLength(url) + 1,
      0,
    );
    state.done = urls.length < 12;
    await atomicWrite(progressPath, JSON.stringify(state));
    return {
      done: state.done && state.day === day,
      attempted: urls.length,
      refreshed: counts.reduce((sum, value) => sum + value, 0),
    };
  } finally {
    globalJob.buyornotProductRefreshActive = false;
  }
}
