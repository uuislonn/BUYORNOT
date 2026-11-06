export interface SharePlatform {
  share?: (data: ShareData) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
}

export function createPostShareUrl(origin: string, postId: string): string {
  const url = new URL("/community", origin);
  url.searchParams.set("post", postId);
  return url.href;
}

export async function sharePost(
  data: ShareData & { url: string },
  platform: SharePlatform,
): Promise<"shared" | "copied" | "cancelled" | "manual"> {
  if (platform.share) {
    try {
      await platform.share(data);
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return "cancelled";
    }
  }
  if (platform.writeText) {
    try {
      await platform.writeText(data.url);
      return "copied";
    } catch {
      // Clipboard permissions may be denied; offer a selectable URL instead.
    }
  }
  return "manual";
}
