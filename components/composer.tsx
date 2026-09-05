"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Composer() {
  const [content, setContent] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!content.trim() || busy) return; setBusy(true); const res = await fetch("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) }); setBusy(false); if (res.ok) { setContent(""); router.refresh(); } }
  return <form onSubmit={submit} className="border-b p-4"><textarea value={content} onChange={e=>setContent(e.target.value)} maxLength={500} placeholder="What’s happening?" className="min-h-24 w-full resize-none outline-none"/><div className="flex items-center justify-between pt-3"><span className="text-xs text-zinc-400">{content.length}/500</span><button disabled={!content.trim() || busy} className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? "Posting…" : "Post"}</button></div></form>;
}
