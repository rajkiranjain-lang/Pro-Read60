import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <main className="min-h-screen"><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><strong>Pro-Read60</strong><nav className="flex gap-4 text-sm"><Link href="/explore">Explore</Link><Link href="/notifications">Notifications</Link><Link href="/messages">Messages</Link>{["ADMIN", "SUPER_ADMIN"].includes(user.role) && <Link href="/admin">Admin</Link>}</nav></div></header><section className="mx-auto max-w-5xl px-6 py-10"><h1 className="text-3xl font-black">Home</h1><p className="mt-2 text-gray-600">Signed in as @{user.username}. Your personalized feed will be powered by the feed service.</p><div className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-bold">Your timeline</h2><p className="mt-2 text-sm text-gray-500">Social feed infrastructure is connected to PostgreSQL and ready for posts, follows and engagement.</p></div></section></main>;
}
