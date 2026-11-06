import type { FeedPost } from "../../../features/community/types";
export type AccountActivity = {
  savedPosts: FeedPost[];
  savedProducts: FeedPost[];
  comments: { id: string; post: FeedPost; text: string; date: string }[];
  notifications: {
    id: string;
    title: string;
    text: string;
    href: string;
    date: string;
  }[];
};
