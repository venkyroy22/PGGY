import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await requireAdmin();

    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.owner.findFirst({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'An owner with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate dummy phone if none provided (since schema still requires phone unique constraint for now)
    const finalPhone = phone || Date.now().toString().slice(-10);

    const owner = await prisma.owner.create({
      data: {
        name,
        email,
        phone: finalPhone,
        passwordHash,
        role: 'OWNER',
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, owner });
  } catch (error) {
    console.error('Create owner error:', error);
    return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 });
  }
}
