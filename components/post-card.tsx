"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Post = { id:string; content:string; createdAt:Date|string; author:{username:string; profile:{displayName:string; avatarUrl:string|null}|null; verification:{badgeType:string}|null}; _count:{likes:number;replies:number;reposts:number;bookmarks:number} };
export default function PostCard({post}:{post:Post}) { const [likes,setLikes]=useState(post._count.likes); const [liked,setLiked]=useState(false); const router=useRouter();
 async function toggleLike(){const res=await fetch(`/api/posts/${post.id}/like`,{method:liked?"DELETE":"POST"}); if(res.ok){setLiked(!liked);setLikes(v=>v+(liked?-1:1));}}
 async function repost(){await fetch(`/api/posts/${post.id}/repost`,{method:"POST"});router.refresh();}
 return <article className="border-b p-4 hover:bg-zinc-50"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-bold">{(post.author.profile?.displayName||post.author.username)[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><div><Link href={`/profile/${post.author.username}`} className="font-bold hover:underline">{post.author.profile?.displayName||post.author.username}</Link>{post.author.verification&&<span className="ml-1 text-blue-600">✓</span>} <span className="ml-1 text-zinc-500">@{post.author.username}</span></div><p className="mt-1 whitespace-pre-wrap break-words leading-6">{post.content}</p><div className="mt-3 flex max-w-lg justify-between text-sm text-zinc-500"><Link href={`/post/${post.id}`} className="hover:text-black">Reply {post._count.replies||""}</Link><button onClick={repost} className="hover:text-green-600">Repost {post._count.reposts||""}</button><button onClick={toggleLike} className={liked?"text-red-600":"hover:text-red-600"}>♥ {likes||""}</button><button onClick={()=>router.refresh()} className="hover:text-black">Share</button></div></div></div></article>;
}
