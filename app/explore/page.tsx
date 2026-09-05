import Link from "next/link";

export default function ExplorePage() {
  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-10"><Link href="/" className="text-sm font-semibold text-blue-600">← Pro-Read60</Link><h1 className="mt-8 text-3xl font-black">Explore</h1><p className="mt-2 text-gray-600">Search, trends and discovery will appear here.</p><div className="mt-8 rounded-2xl border bg-white p-6"><input aria-label="Search" placeholder="Search Pro-Read60" className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" /></div></main>;
}
