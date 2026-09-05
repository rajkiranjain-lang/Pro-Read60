import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

type NotificationItem = { id: string; type: string; readAt: Date | null; createdAt: Date };

export default async function NotificationsPage(){const user=await getCurrentUser();if(!user)return <main className="mx-auto max-w-xl p-10"><h1 className="text-2xl font-bold">Notifications</h1><Link className="mt-4 inline-block underline" href="/login">Log in</Link></main>;const items: NotificationItem[] = await db.notification.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:50});return <main className="mx-auto min-h-screen max-w-2xl border-x"><header className="border-b p-5"><h1 className="text-xl font-black">Notifications</h1></header>{items.length?items.map((n: NotificationItem)=><div key={n.id} className={`border-b p-5 ${n.readAt?"":"bg-zinc-50"}`}><p className="font-medium">{n.type.replaceAll("_"," ").toLowerCase()}</p><p className="mt-1 text-sm text-zinc-500">{n.createdAt.toLocaleString()}</p></div>):<div className="p-10 text-center text-zinc-500">You’re all caught up.</div>}</main>}
