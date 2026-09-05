import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){const user=await requireUser();const {id}=await params;const post=await db.post.findUnique({where:{id},select:{id:true,deletedAt:true}});if(!post||post.deletedAt)return NextResponse.json({error:"Post not found"},{status:404});await db.bookmark.upsert({where:{userId_postId:{userId:user.id,postId:id}},create:{userId:user.id,postId:id},update:{}});return NextResponse.json({bookmarked:true});}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){const user=await requireUser();const {id}=await params;await db.bookmark.deleteMany({where:{userId:user.id,postId:id}});return NextResponse.json({bookmarked:false});}
