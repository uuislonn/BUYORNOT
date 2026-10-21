export const CATEGORIES = [
  "전체",
  "의류",
  "뷰티",
  "신발",
  "잡화",
  "명품",
] as const;
export type Category = Exclude<(typeof CATEGORIES)[number], "전체">;
export type Role = "USER" | "CREATOR" | "ADMIN";
export type Decision = "BUY" | "NOT";
export type Status = "ING" | Decision | "EXPIRED";
export type DemoIdentity = "guest" | "member" | "creator" | "admin";
export type Profile = {
  id: string;
  nickname: string;
  role: Role;
  avatar: string;
  verified: boolean;
};
export type Creator = {
  id: string;
  ownerId: string;
  handle: string;
  title: string;
  bio: string;
  cover: string;
  links: { label: string; url: string }[];
};
export type Product = {
  url: string;
  name: string;
  brand: string;
  image: string;
  price: number | null;
  category: Category;
  currency: "KRW";
};
export type BodySpec = Partial<{
  age: number;
  height_cm: number;
  weight_kg: number;
  body_type: string;
  personal_color: string;
}>;
export type CurationRequest = {
  id: string;
  creatorId: string;
  authorId: string;
  product: Product;
  concern: string;
  tags: string[];
  bodySpec: BodySpec;
  status: Status;
  createdAt: string;
  updatedAt: string;
};
export type Evaluation = {
  id: string;
  requestId: string;
  creatorId: string;
  decision: Decision;
  comment: string;
  createdAt: string;
};
export type Application = {
  id: string;
  userId: string;
  roomTitle: string;
  bio: string;
  channelType: "Instagram" | "YouTube" | "TikTok" | "Blog";
  channelUrl: string;
  followers: number;
  contentCount: number;
  verificationCode: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string;
  createdAt: string;
};
export type Database = {
  profiles: Profile[];
  creators: Creator[];
  requests: CurationRequest[];
  evaluations: Evaluation[];
  applications: Application[];
  hearts: Record<string, string[]>;
  follows: Record<string, string[]>;
};
export type Snapshot = {
  creator: Creator;
  owner: Profile;
  viewer: Profile | null;
  profiles: Profile[];
  requests: CurationRequest[];
  evaluations: Evaluation[];
  applications: Application[];
  ownApplication: Application | null;
  following: boolean;
  followerCount: number;
  likedIds: string[];
  demoEnabled: boolean;
  serverTime: string;
};
export type RequestInput = {
  creatorId: string;
  productUrl: string;
  productName: string;
  brand: string;
  price: number | null;
  category: Category;
  concern: string;
  tags: string[];
  bodySpec: BodySpec;
};
export type ApplicationInput = {
  roomTitle: string;
  bio: string;
  channelType: Application["channelType"];
  channelUrl: string;
  followers: number;
  contentCount: number;
  verificationCode: string;
  consent: boolean;
};
export type Result<T> =
  { ok: true; data: T } | { ok: false; code: string; error: string };
