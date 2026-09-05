import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "analytics.read")) redirect("/login");
  const [users, posts, reports, messages] = await Promise.all([
    db.user.count(), db.post.count({ where: { deletedAt: null } }), db.report.count({ where: { status: "OPEN" } }), db.message.count({ where: { deletedAt: null } }),
  ]);
  const cards = [["Users", users], ["Posts", posts], ["Open reports", reports], ["Messages", messages]];
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="mx-auto max-w-7xl px-6 py-5"><div className="text-sm font-semibold text-blue-600">PRO-READ60 ADMIN</div><h1 className="mt-1 text-3xl font-black">Control Center</h1><p className="mt-1 text-sm text-gray-500">Role: {user.role}</p></div></header><section className="mx-auto max-w-7xl px-6 py-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="text-sm text-gray-500">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>)}</div><div className="mt-8 grid gap-4 md:grid-cols-2"><AdminLink href="/admin/users" title="User management" text="Search, suspend, ban and manage users." /><AdminLink href="/admin/reports" title="Moderation" text="Review reports and moderation actions." /><AdminLink href="/admin/settings" title="Platform settings" text="Control global platform behavior." /><AdminLink href="/admin/features" title="Feature flags" text="Enable or disable platform features." /><AdminLink href="/admin/audit" title="Audit logs" text="Review administrative actions." /><AdminLink href="/admin/analytics" title="Analytics" text="Monitor platform activity." /></div></section></main>;
}

function AdminLink({ href, title, text }: { href: string; title: string; text: string }) { return <a href={href} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow"><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm text-gray-500">{text}</p></a>; }
