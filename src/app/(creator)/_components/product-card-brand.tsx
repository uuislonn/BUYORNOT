"use client";

import Image from "next/image";
import { useState } from "react";
import { brandLogo } from "../_lib/brand-logo";
import s from "./creator.module.css";

export function ProductCardBrand({ brand }: { brand?: string }) {
  const [failed, setFailed] = useState(false);
  const name = brand?.trim();
  if (!name) return null;
  const logo = brandLogo(name);
  return (
    <div className={s.brandRow}>
      <span className={s.brandMark} aria-hidden="true">
        {logo && !failed ? (
          <Image
            src={logo}
            alt=""
            width={32}
            height={32}
            unoptimized
            onError={() => setFailed(true)}
          />
        ) : (
          <span className={s.brandFallback}>*</span>
        )}
      </span>
      <span className={s.brandName}>{name}</span>
    </div>
  );
}
