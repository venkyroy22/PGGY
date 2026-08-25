import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateRentCycles } from '@/lib/rent-generator';
import { prisma } from '@/lib/prisma';

// GET /api/rent-cycles — get rent cycles for the owner
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month')) || (new Date().getMonth() + 1);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const status = searchParams.get('status') || 'all'; // pending, partial, paid, overdue

    const cycles = await prisma.rentCycle.findMany({
      where: {
        tenant: {
          bed: {
            room: {
              property: {
                ownerId: session.ownerId
              }
            }
          }
        },
        month,
        year,
        ...(status !== 'all' ? { status } : {})
      },
      include: {
        tenant: {
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    property: {
                      select: { id: true, name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json({ cycles });
  } catch (error) {
    console.error('[RentCycles GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rent-cycles/generate-manual — manually trigger generation for the owner
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const month = parseInt(body.month) || (new Date().getMonth() + 1);
    const year = parseInt(body.year) || new Date().getFullYear();

    // Only generate for THIS owner's tenants
    const result = await generateRentCycles(month, year, session.ownerId);

    return NextResponse.json({
      success: true,
      message: `Rent cycles generated`,
      stats: result
    });
  } catch (error) {
    console.error('[RentCycles Manual Gen] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
