import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  await prisma.ticket.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    }
  });
  return NextResponse.json({ success: true });
}
