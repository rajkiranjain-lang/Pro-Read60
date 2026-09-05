import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
export async function POST(req:Request){const user=await requireUser();const body=await req.json().catch(()=>({}));if(body.id)await db.notification.updateMany({where:{id:body.id,userId:user.id},data:{readAt:new Date()}});else await db.notification.updateMany({where:{userId:user.id,readAt:null},data:{readAt:new Date()}});return NextResponse.json({ok:true});}
