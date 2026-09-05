"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setError(""); const data = Object.fromEntries(new FormData(e.currentTarget)); const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); const body = await res.json(); setBusy(false); if (!res.ok) return setError(body.error ?? "Login failed"); router.push("/home"); router.refresh(); }
  return <main className="flex min-h-screen items-center justify-center px-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-3xl font-black">Log in</h1><p className="mt-2 text-gray-600">Welcome back to Pro-Read60.</p><label className="mt-6 block text-sm font-semibold">Email<input name="email" type="email" required className="mt-2 w-full rounded-xl border px-4 py-3" /></label><label className="mt-4 block text-sm font-semibold">Password<input name="password" type="password" required className="mt-2 w-full rounded-xl border px-4 py-3" /></label>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={busy} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-60">{busy ? "Logging in…" : "Log in"}</button></form></main>;
}
