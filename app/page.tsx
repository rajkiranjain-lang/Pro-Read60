import Link from "next/link";

const features = [
  ["Social feed", "Posts, replies, likes, reposts, quotes and bookmarks."],
  ["Discovery", "Search users and content with hashtag-ready architecture."],
  ["Private messaging", "One-to-one and group conversations with privacy controls."],
  ["Admin control", "RBAC, moderation, feature flags, settings and audit logs."],
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-black tracking-tight">Pro-Read60</Link>
          <nav className="flex gap-3 text-sm">
            <Link href="/explore" className="rounded-full px-4 py-2 hover:bg-gray-100">Explore</Link>
            <Link href="/login" className="rounded-full border px-4 py-2">Log in</Link>
            <Link href="/register" className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white">Join</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">The Pro-Read60 platform</p>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl">A social network built for conversation, discovery and control.</h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">A production-oriented Next.js social platform with a complete administrative control layer.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">Create account</Link>
            <Link href="/explore" className="rounded-xl border bg-white px-6 py-3 font-semibold">Explore the platform</Link>
          </div>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {features.map(([title, text]) => <article key={title} className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-gray-600">{text}</p></article>)}
        </div>
      </section>
    </main>
  );
}
