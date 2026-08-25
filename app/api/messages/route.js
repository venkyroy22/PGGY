import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/messages — get message logs for the owner's tenants
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;

    const messages = await prisma.messageLog.findMany({
      where: {
        tenant: {
          bed: {
            room: {
              property: {
                ownerId: session.ownerId
              }
            }
          }
        }
      },
      include: {
        tenant: {
          select: { name: true, phone: true }
        },
        rentCycle: {
          select: { month: true, year: true, amountDue: true }
        }
      },
      orderBy: { sentAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[Messages GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
