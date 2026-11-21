import products from "./official-products.json";
import selections from "./official-room-selections.json";
import type { Product } from "../_lib/types";

// Individually checked brand sales pages, not creator endorsements.
// Foreign-currency offers have no invented KRW conversion.
export const OFFICIAL_PRODUCTS = products as {
  id: string;
  checkedAt: string;
  imageSource: string;
  product: Product;
}[];
export const OFFICIAL_ROOM_SELECTIONS: Record<string, string[]> = selections;
