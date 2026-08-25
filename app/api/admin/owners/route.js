import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    const owners = await prisma.owner.findMany({
      where: { role: 'OWNER' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { properties: true }
        }
      }
    });

    return NextResponse.json({ owners });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    const { ownerId, status } = await request.json();

    if (!ownerId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const owner = await prisma.owner.update({
      where: { id: ownerId },
      data: { status }
    });

    return NextResponse.json({ success: true, owner });
  } catch (error) {
    console.error('Update owner error:', error);
    return NextResponse.json({ error: 'Failed to update owner' }, { status: 500 });
  }
}
