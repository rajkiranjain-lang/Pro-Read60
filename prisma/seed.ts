import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "change-me-before-production", 12);
  const admin = await db.user.upsert({ where: { email: "admin@pro-read60.local" }, update: {}, create: { username: "admin", email: "admin@pro-read60.local", passwordHash, role: "SUPER_ADMIN", emailVerifiedAt: new Date(), profile: { create: { displayName: "Pro-Read60 Admin" } }, preferences: { create: {} }, notificationPreferences: { create: {} } } });
  const features = ["POSTS_ENABLED", "COMMENTS_ENABLED", "MESSAGES_ENABLED", "GROUP_MESSAGES_ENABLED", "VIDEO_ENABLED", "GIF_ENABLED", "POLLS_ENABLED", "BOOKMARKS_ENABLED", "SEARCH_ENABLED", "TRENDING_ENABLED", "RECOMMENDATIONS_ENABLED", "GUEST_ACCESS_ENABLED", "POST_EDITING_ENABLED"];
  for (const key of features) await db.featureFlag.upsert({ where: { key }, update: {}, create: { key, enabled: true } });
  await db.platformSetting.upsert({ where: { key: "MAX_POST_LENGTH" }, update: {}, create: { key: "MAX_POST_LENGTH", value: 500 } });
  console.log(`Seeded SUPER_ADMIN ${admin.username}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
