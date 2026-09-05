import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Composer from "@/components/composer";
import PostCard from "@/components/post-card";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-3xl font-bold">Your feed</h1><p className="mt-3 text-zinc-500">Log in to join the conversation.</p><Link href="/login" className="mt-6 inline-block rounded-full bg-black px-5 py-2.5 font-semibold text-white">Log in</Link></main>;
  const following = await db.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } });
  const ids = [user.id, ...following.map(x => x.followingId)];
  const posts = await db.post.findMany({ where: { deletedAt: null, OR: [{ authorId: { in: ids }, visibility: { in: ["PUBLIC", "FOLLOWERS"] } }, { authorId: user.id } ] }, include: { author: { include: { profile: true, verification: true } }, media: { include: { media: true }, orderBy: { position: "asc" } }, _count: { select: { likes: true, replies: true, reposts: true, bookmarks: true } } }, orderBy: { createdAt: "desc" }, take: 30 });
  return <main className="mx-auto min-h-screen max-w-2xl border-x border-zinc-200 bg-white"><header className="sticky top-0 z-10 border-b bg-white/90 px-5 py-4 backdrop-blur"><h1 className="text-xl font-black">Home</h1></header><Composer /><section>{posts.length ? posts.map(post => <PostCard key={post.id} post={post} />) : <div className="p-10 text-center text-zinc-500">No posts yet. Follow people or publish your first post.</div>}</section></main>;
}
