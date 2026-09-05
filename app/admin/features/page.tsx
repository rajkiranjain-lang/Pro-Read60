import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function FeaturesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "features.read")) redirect("/login");
  const features = await db.featureFlag.findMany({ orderBy: { key: "asc" } });
  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-10"><a href="/admin" className="text-sm font-semibold text-blue-600">← Admin</a><h1 className="mt-6 text-3xl font-black">Feature flags</h1><p className="mt-2 text-gray-500">These values are persisted and enforced by server-side application logic.</p><div className="mt-8 overflow-hidden rounded-2xl border bg-white">{features.map((feature) => <div key={feature.id} className="flex items-center justify-between border-b px-5 py-4 last:border-0"><div><div className="font-semibold">{feature.key}</div><div className="text-sm text-gray-500">{feature.description ?? "Platform feature"}</div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${feature.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{feature.enabled ? "Enabled" : "Disabled"}</span></div>)}</div></main>;
}
