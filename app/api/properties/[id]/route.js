import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/properties/[id] — get single property with rooms/beds
export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: { id, ownerId: session.ownerId },
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                tenant: {
                  select: { id: true, name: true, phone: true, status: true, dueDay: true },
                },
              },
              orderBy: { bedNumber: 'asc' },
            },
          },
          orderBy: { roomNumber: 'asc' },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('[Property GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/properties/[id] — update property
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, address, city } = body;

    // Check ownership
    const existing = await prisma.property.findFirst({
      where: { id, ownerId: session.ownerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Property name is required' }, { status: 400 });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error('[Property PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/properties/[id] — delete property (cascades to rooms/beds)
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.property.findFirst({
      where: { id, ownerId: session.ownerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Property deleted' });
  } catch (error) {
    console.error('[Property DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
