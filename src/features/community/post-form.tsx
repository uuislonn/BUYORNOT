"use client";

import { useMemo, useState } from "react";
import { RequestForm } from "../../app/(creator)/_components/request-form";
import { validateCommunityProductImage } from "./product-metadata";
import { validateProductUrl } from "./product";
import { itemCategory } from "../../app/(creator)/_lib/product-category";
import { getProductInfo, savePost } from "./actions";
import type { FeedPost } from "./types";

async function lookup(url: string) {
  const link = validateProductUrl(url.trim());
  const result = await getProductInfo(link.href);
  const product = result.ok
    ? {
        ...result.data,
        price: result.data.price || null,
        brand: result.data.brand || link.hostname,
        category:
          link.hostname === "www.oliveyoung.co.kr"
            ? ("뷰티" as const)
            : /\btop\b/i.test(result.data.name)
              ? ("의류" as const)
              : itemCategory(result.data.name),
      }
    : {
        url: link.href,
        name: "",
        brand: "",
        image: "",
        price: null,
        category: "의류" as const,
        currency: "KRW" as const,
      };
  return {
    ok: true as const,
    data: {
      product,
      duplicateId: result.ok ? result.data.duplicateId : null,
      warning: result.ok ? null : result.error,
    },
  };
}

export function PostForm({
  post,
  initialUrl,
  close,
  saved,
}: {
  post?: FeedPost;
  initialUrl: string;
  close: () => void;
  saved: (post: FeedPost) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const edit = useMemo(() => {
    if (!post) return undefined;
    const profile = post.bodyProfile;
    const number = (value?: string) =>
      value?.trim() && Number.isFinite(Number(value))
        ? Number(value)
        : undefined;
    return {
      id: post.id,
      product: {
        ...post.product,
        price: post.product.price || null,
        category: post.category === "명품" ? ("잡화" as const) : post.category,
      },
      concern: post.concern,
      tags: post.tags ?? [],
      bodySpec: Object.fromEntries(
        Object.entries({
          age: number(profile.age),
          height_cm: number(profile.height_cm),
          weight_kg: number(profile.weight_kg),
          personal_color: profile.personal_color,
          body_type: profile.body_type,
        }).filter(([, value]) => value !== undefined),
      ),
    };
  }, [post]);

  return (
    <RequestForm
      creatorId=""
      initialUrl={initialUrl}
      lookup={lookup}
      validateImage={validateCommunityProductImage}
      edit={edit}
      busy={busy}
      serverError={error}
      onClose={close}
      onSubmit={async (input, id) => {
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          const result = await savePost(
            {
              productUrl: input.productUrl,
              category:
                post?.category === "명품" &&
                input.category === edit?.product.category
                  ? post.category
                  : input.category,
              concern: input.concern,
              visibility: "PUBLIC",
              tags: input.tags,
              bodyProfile: Object.fromEntries(
                Object.entries(input.bodySpec).map(([key, value]) => [
                  key,
                  String(value),
                ]),
              ),
            },
            id,
            {
              name: input.productName,
              brand: input.brand,
              image: input.productImage ?? "",
              price: input.price ?? 0,
              originalPrice: input.originalPrice,
              discountRate: input.discountRate,
            },
          );
          if (result.ok) saved(result.data);
          else setError(result.error);
        } catch {
          setError("저장하지 못했습니다. 다시 시도해 주세요.");
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
