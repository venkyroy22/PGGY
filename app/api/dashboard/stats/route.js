import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard/stats — fetch real-time overview stats for the owner
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ownerId = session.ownerId;

    const properties = await prisma.property.findMany({
      where: { ownerId },
      include: {
        rooms: {
          include: {
            beds: {
              include: { tenant: true },
            },
          },
        },
      },
    });

    let totalBeds = 0;
    let occupied = 0;

    properties.forEach(property => {
      property.rooms.forEach(room => {
        totalBeds += room.beds.length;
        occupied += room.beds.filter(bed => bed.tenant && bed.tenant.status === 'active').length;
      });
    });

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const rentCycles = await prisma.rentCycle.findMany({
      where: {
        tenant: {
          bed: {
            room: {
              property: {
                ownerId: ownerId,
              },
            },
          },
        },
      },
    });

    let paidThisMonth = 0;
    let pending = 0;
    let overdue = 0;

    rentCycles.forEach(cycle => {
      const balance = Math.max(0, cycle.amountDue - cycle.amountPaid);
      
      if (cycle.month === currentMonth && cycle.year === currentYear) {
        paidThisMonth += cycle.amountPaid;
        if (cycle.status === 'pending' || cycle.status === 'partial') {
          pending += balance;
        }
      }

      if (cycle.status === 'overdue' || (cycle.dueDate < currentDate && cycle.amountPaid < cycle.amountDue)) {
        overdue += balance;
      }
    });

    return NextResponse.json({
      stats: {
        totalBeds,
        occupied,
        paidThisMonth,
        pending,
        overdue
      }
    });
  } catch (error) {
    console.error('[Dashboard Stats GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
