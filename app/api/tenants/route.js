import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tenants — list all tenants for the owner
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active'; // 'active', 'vacated', 'all'

    const tenants = await prisma.tenant.findMany({
      where: {
        property: {
          ownerId: session.ownerId
        },
        ...(status !== 'all' ? { status } : {})
      },
      include: {
        bed: {
          include: {
            room: {
              include: {
                property: {
                  select: { id: true, name: true, city: true }
                }
              }
            }
          }
        },
        rentCycles: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('[Tenants GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenants — create a new tenant
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, aadharNumber, propertyId, bedId, moveInDate, dueDay, depositAmount, billingType, agreedRent, moveOutDate, address, gender } = body;

    // Validation
    if (!name || !phone || !bedId || !propertyId || !moveInDate || !billingType || !agreedRent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rent = parseFloat(agreedRent);
    if (!rent || rent <= 0) {
      return NextResponse.json({ error: 'Agreed rent must be a positive number' }, { status: 400 });
    }

    let day = null;
    if (billingType === 'MONTHLY') {
      if (!dueDay) {
        return NextResponse.json({ error: 'Due day is required for monthly billing' }, { status: 400 });
      }
      day = parseInt(dueDay, 10);
      if (day < 1 || day > 28) {
        return NextResponse.json({ error: 'Due day must be between 1 and 28' }, { status: 400 });
      }
    }

    let checkout = null;
    if (billingType === 'DAILY' && moveOutDate) {
      checkout = new Date(moveOutDate);
      if (checkout < new Date(moveInDate)) {
         return NextResponse.json({ error: 'Check-out date cannot be before move-in date' }, { status: 400 });
      }
    }

    // Verify bed ownership and availability
    const bed = await prisma.bed.findFirst({
      where: { id: bedId },
      include: {
        tenant: true,
        room: {
          include: {
            property: true
          }
        }
      }
    });

    if (!bed || bed.room.property.ownerId !== session.ownerId) {
      return NextResponse.json({ error: 'Bed not found or unauthorized' }, { status: 404 });
    }

    if (bed.tenant && bed.tenant.status === 'active') {
      return NextResponse.json({ error: 'Bed is already occupied' }, { status: 409 });
    }

    // Clean phone number (strip spaces/non-digits, ensure country code)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India
    }
    if (!cleanPhone.startsWith('91')) {
       return NextResponse.json({ error: 'Only Indian phone numbers are supported (start with 91 or 10 digits)' }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        aadharNumber: aadharNumber ? aadharNumber.trim() : null,
        address: address ? address.trim() : null,
        gender: gender || null,
        propertyId,
        bedId,
        moveInDate: new Date(moveInDate),
        dueDay: day,
        moveOutDate: checkout,
        billingType,
        agreedRent: rent,
        depositAmount: parseFloat(depositAmount) || 0,
        status: 'active'
      },
      include: {
        bed: {
          include: {
            room: {
              include: {
                property: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    // Send WhatsApp Welcome Message (non-blocking)
    import('@/lib/whatsapp').then(({ sendWhatsAppMessage, WHATSAPP_TEMPLATES }) => {
      const firstName = tenant.name.split(' ')[0];
      const propertyName = tenant.bed.room.property.name;
      const bedName = `${tenant.bed.room.name} - ${tenant.bed.name}`;
      
      // Fire and forget
      sendWhatsAppMessage(tenant.phone, WHATSAPP_TEMPLATES.WELCOME_MESSAGE, [
        firstName,
        propertyName,
        bedName
      ]).catch(err => console.error('[WhatsApp] Failed to send welcome message:', err));
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error('[Tenants POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
