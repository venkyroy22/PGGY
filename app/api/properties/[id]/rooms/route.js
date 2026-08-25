import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/properties/[id]/rooms — create a room with beds
export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;
    const body = await request.json();
    const { roomNumber, bedCount, monthlyRent, dailyRent } = body;

    // Verify ownership
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ownerId: session.ownerId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Validation
    if (!roomNumber || typeof roomNumber !== 'string' || roomNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Room number is required' }, { status: 400 });
    }

    const beds = parseInt(bedCount, 10);
    if (!beds || beds < 1 || beds > 20) {
      return NextResponse.json({ error: 'Bed count must be between 1 and 20' }, { status: 400 });
    }

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

    // Check for duplicate room number
    const existingRoom = await prisma.room.findFirst({
      where: { propertyId, roomNumber: roomNumber.trim() },
    });

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists in this property' }, { status: 409 });
    }

    // Create room with beds in a transaction
    const room = await prisma.room.create({
      data: {
        propertyId,
        roomNumber: roomNumber.trim(),
        beds: {
          create: Array.from({ length: beds }, (_, i) => ({
            bedNumber: String(i + 1),
            monthlyRent: rent,
            dailyRent: parsedDailyRent,
          })),
        },
      },
      include: {
        beds: true,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('[Rooms POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
