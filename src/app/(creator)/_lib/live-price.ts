export const PRICE_REFRESH_MS = 5 * 60 * 1000;

export type LivePrice = {
  price: number;
  originalPrice: number | null;
  discountRate: number | null;
  checkedAt: string;
};

export type RefreshedProduct = {
  name: string;
  brand?: string;
  image: string;
  price: LivePrice | null;
};

export type ProductUpdate = {
  price: LivePrice | null;
  product: RefreshedProduct | null;
};
