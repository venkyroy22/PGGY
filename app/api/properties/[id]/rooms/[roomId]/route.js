import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/properties/[id]/rooms/[roomId] — delete a room
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId, roomId } = await params;

    // Verify ownership
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: session.ownerId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, propertyId },
      include: {
        beds: {
          include: { tenant: { select: { id: true, status: true } } },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if any beds have active tenants
    const activeTenants = room.beds.filter(bed => bed.tenant?.status === 'active');
    if (activeTenants.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete room with active tenants. Vacate all tenants first.' },
        { status: 400 }
      );
    }

    await prisma.room.delete({ where: { id: roomId } });

    return NextResponse.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    console.error('[Room DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
