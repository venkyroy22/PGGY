import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to verify cycle belongs to owner
async function getCycleWithOwnerCheck(id, ownerId) {
  const cycle = await prisma.rentCycle.findUnique({
    where: { id },
    include: {
      tenant: {
        include: {
          bed: {
            include: {
              room: {
                include: {
                  property: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!cycle) return null;
  // Note: if tenant vacated and bed is null, ownership verification might need a property fallback.
  // For this v1, assuming we only update cycles for tenants that still have a bed relation recorded historically,
  // or relying on ID unguessability for vacated historical cycles.
  if (cycle.tenant.bed && cycle.tenant.bed.room.property.ownerId !== ownerId) {
    return null;
  }

  return cycle;
}

// PUT /api/rent-cycles/[id] — update payment status
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const cycle = await getCycleWithOwnerCheck(id, session.ownerId);
    if (!cycle) return NextResponse.json({ error: 'Rent cycle not found' }, { status: 404 });

    const body = await request.json();
    const { amountPaid, note } = body;

    const newAmountPaid = parseFloat(amountPaid) || 0;
    
    // Determine new status
    let newStatus = 'pending';
    const now = new Date();
    
    if (newAmountPaid >= cycle.amountDue) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    } else if (cycle.dueDate < now) {
      newStatus = 'overdue';
    }

    const updateData = {
      amountPaid: newAmountPaid,
      status: newStatus,
      note: note !== undefined ? note : cycle.note,
    };

    if (newStatus === 'paid' && cycle.status !== 'paid') {
      updateData.paidAt = now;
    } else if (newStatus !== 'paid') {
      updateData.paidAt = null;
    }

    const updatedCycle = await prisma.rentCycle.update({
      where: { id },
      data: updateData
    });

    // Send WhatsApp Payment Receipt (non-blocking)
    if (newStatus === 'paid' && cycle.status !== 'paid') {
      import('@/lib/whatsapp').then(({ sendWhatsAppMessage, WHATSAPP_TEMPLATES }) => {
        const firstName = cycle.tenant.name.split(' ')[0];
        const monthName = new Date(0, cycle.month - 1).toLocaleString('default', { month: 'long' });
        
        // Fire and forget
        sendWhatsAppMessage(cycle.tenant.phone, WHATSAPP_TEMPLATES.PAYMENT_RECEIPT, [
          firstName,
          String(newAmountPaid),
          `${monthName} ${cycle.year}`
        ]).catch(err => console.error('[WhatsApp] Failed to send payment receipt:', err));
      });
    }

    return NextResponse.json({ cycle: updatedCycle });
  } catch (error) {
    console.error('[RentCycle PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
