import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    const [totalOwners, activeOwners, pendingProperties] = await Promise.all([
      prisma.owner.count({ where: { role: 'OWNER' } }),
      prisma.owner.count({ where: { role: 'OWNER', status: 'ACTIVE' } }),
      prisma.property.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      totalOwners,
      activeOwners,
      pendingProperties
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
