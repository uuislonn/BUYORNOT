export const categories = [
  "전체",
  "의류",
  "뷰티",
  "신발",
  "잡화",
  "명품",
] as const;
export type Category = Exclude<(typeof categories)[number], "전체">;
export type Choice = "BUY" | "NOT";
export type Visibility = "PUBLIC" | "FOLLOWERS" | "LINK_ONLY";
export type BodyProfile = Partial<
  Record<
    "age" | "height_cm" | "weight_kg" | "body_type" | "personal_color",
    string
  >
>;
export interface Product {
  url: string;
  domain: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number | null;
  discountRate?: number | null;
  currency: "KRW";
}
export interface Post {
  id: string;
  authorId: string;
  nickname: string;
  product: Product;
  category: Category;
  concern: string;
  visibility: Visibility;
  bodyProfile: BodyProfile;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  buy: number;
  not: number;
  /** Legacy posts without this field start at zero. */
  views?: number;
}
export interface FeedPost extends Post {
  myVote: Choice | null;
}
export interface PostInput {
  productUrl: string;
  category: Category;
  concern: string;
  visibility: Visibility;
  bodyProfile: BodyProfile;
  tags?: string[];
}
export interface Viewer {
  id: string;
  nickname: string;
}
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type CommentTarget =
  | { kind: "community"; postId: string }
  | { kind: "curation"; roomId: string; postId: string };

export type DiscussionComment = {
  id: string;
  nickname: string;
  body: string;
  createdAt: string;
};
