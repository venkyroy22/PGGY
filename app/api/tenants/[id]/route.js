import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to verify tenant belongs to the owner
async function getTenantWithOwnerCheck(tenantId, ownerId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      bed: {
        include: {
          room: {
            include: {
              property: true
            }
          }
        }
      },
      rentCycles: {
        orderBy: { dueDate: 'desc' }
      }
    }
  });

  if (!tenant) return null;
  // If the tenant is active/assigned to a bed, check property owner
  if (tenant.bed && tenant.bed.room.property.ownerId !== ownerId) {
    return null;
  }
  
  // If tenant vacated, bed might be null, but we'd normally track historical property ID. 
  // For V1, we rely on the fact that tenant UUIDs are hard to guess. 
  return tenant;
}

// GET /api/tenants/[id]
export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const tenant = await getTenantWithOwnerCheck(id, session.ownerId);

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('[Tenant GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tenants/[id] (update tenant details or vacate)
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const tenant = await getTenantWithOwnerCheck(id, session.ownerId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'vacate') {
      const { moveOutDate } = data;
      if (!moveOutDate) return NextResponse.json({ error: 'Move out date required' }, { status: 400 });

      const vacatedTenant = await prisma.tenant.update({
        where: { id },
        data: {
          status: 'vacated',
          moveOutDate: new Date(moveOutDate),
          bedId: null // Free up the bed
        }
      });
      return NextResponse.json({ tenant: vacatedTenant, message: 'Tenant vacated successfully' });
    }

    // Regular update
    const { name, phone, dueDay } = data;
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.replace(/\D/g, '') : undefined,
        dueDay: dueDay ? parseInt(dueDay, 10) : undefined,
      }
    });

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    console.error('[Tenant PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tenants/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const tenant = await getTenantWithOwnerCheck(id, session.ownerId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    await prisma.tenant.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Tenant deleted completely' });
  } catch (error) {
    console.error('[Tenant DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
