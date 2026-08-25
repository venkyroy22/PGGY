import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauth' });
  
  const whereClause = { status: 'active' };
  whereClause.bed = { room: { property: { ownerId: session.ownerId } } };
  
  const tenants = await prisma.tenant.findMany({ where: whereClause, include: { bed: true } });
  return NextResponse.json({ tenants, ownerId: session.ownerId });
}
