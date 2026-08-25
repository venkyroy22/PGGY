import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/beds/[id] — update bed rent
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { monthlyRent, dailyRent } = body;

    const rent = parseFloat(monthlyRent);
    if (!rent || rent <= 0) {
      return NextResponse.json({ error: 'Monthly rent must be a positive number' }, { status: 400 });
    }

    let parsedDailyRent = null;
    if (dailyRent) {
      parsedDailyRent = parseFloat(dailyRent);
      if (isNaN(parsedDailyRent) || parsedDailyRent <= 0) {
        return NextResponse.json({ error: 'Daily rent must be a positive number' }, { status: 400 });
      }
    }

    // Verify ownership through the relation chain
    const bed = await prisma.bed.findFirst({
      where: { id },
      include: {
        room: {
          include: {
            property: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!bed || bed.room.property.ownerId !== session.ownerId) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    const updated = await prisma.bed.update({
      where: { id },
      data: { monthlyRent: rent, dailyRent: parsedDailyRent },
    });

    return NextResponse.json({ bed: updated });
  } catch (error) {
    console.error('[Bed PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
