import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/properties — list all properties for the logged-in owner
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }



    const properties = await prisma.property.findMany({
      where: { ownerId: session.ownerId },
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                tenant: {
                  select: { id: true, name: true, status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each property
    const propertiesWithStats = properties.map(property => {
      const totalBeds = property.rooms.reduce((sum, room) => sum + room.beds.length, 0);
      const occupiedBeds = property.rooms.reduce(
        (sum, room) => sum + room.beds.filter(bed => bed.tenant && bed.tenant.status === 'active').length,
        0
      );

      return {
        ...property,
        stats: {
          totalRooms: property.rooms.length,
          totalBeds,
          occupiedBeds,
          vacantBeds: totalBeds - occupiedBeds,
        },
      };
    });

    return NextResponse.json({ properties: propertiesWithStats });
  } catch (error) {
    console.error('[Properties GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/properties — create a new property
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, city } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Property name is required' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        ownerId: session.ownerId,
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('[Properties POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
