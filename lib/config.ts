import { db } from "./db";

export const DEFAULT_FEATURES = [
  "POSTS_ENABLED", "COMMENTS_ENABLED", "MESSAGES_ENABLED", "GROUP_MESSAGES_ENABLED",
  "VIDEO_ENABLED", "GIF_ENABLED", "POLLS_ENABLED", "BOOKMARKS_ENABLED", "SEARCH_ENABLED",
  "TRENDING_ENABLED", "RECOMMENDATIONS_ENABLED", "GUEST_ACCESS_ENABLED", "POST_EDITING_ENABLED",
];

export async function featureEnabled(key: string) {
  const flag = await db.featureFlag.findUnique({ where: { key } });
  return flag?.enabled ?? true;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const setting = await db.platformSetting.findUnique({ where: { key } });
  return (setting?.value as T | undefined) ?? fallback;
}
