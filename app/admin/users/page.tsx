import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const actor = await getCurrentUser();
  if (!actor || !hasPermission(actor.role, "users.read")) redirect("/login");
  const users = await db.user.findMany({ select: { id: true, username: true, email: true, role: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return <main className="mx-auto min-h-screen max-w-6xl px-6 py-10"><a href="/admin" className="text-sm font-semibold text-blue-600">← Admin</a><h1 className="mt-6 text-3xl font-black">Users</h1><div className="mt-8 overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-gray-500"><th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Joined</th></tr></thead><tbody>{users.map((u) => <tr key={u.id} className="border-b last:border-0"><td className="px-5 py-4"><div className="font-semibold">@{u.username}</div><div className="text-gray-500">{u.email}</div></td><td className="px-5 py-4">{u.role}</td><td className="px-5 py-4">{u.status}</td><td className="px-5 py-4">{u.createdAt.toLocaleDateString()}</td></tr>)}</tbody></table></div></main>;
}
