import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
const schema=z.object({content:z.string().trim().min(1).max(5000),parentId:z.string().optional()});
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const replies=await db.reply.findMany({where:{postId:id,deletedAt:null},include:{post:true},orderBy:{createdAt:"asc"},take:100});return NextResponse.json({replies});}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const user=await requireUser();const {id}=await params;const post=await db.post.findUnique({where:{id},select:{id:true,authorId:true,replyLocked:true,deletedAt:true}});if(!post||post.deletedAt)return NextResponse.json({error:"Post not found"},{status:404});if(post.replyLocked)return NextResponse.json({error:"Replies are locked"},{status:403});const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid reply"},{status:400});const reply=await db.reply.create({data:{postId:id,authorId:user.id,content:parsed.data.content,parentId:parsed.data.parentId}});if(post.authorId!==user.id)await db.notification.create({data:{userId:post.authorId,actorId:user.id,type:"REPLY",entityId:id}});return NextResponse.json({reply},{status:201});}
