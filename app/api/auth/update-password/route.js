import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Both current and new passwords are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find owner
    const owner = await prisma.owner.findUnique({
      where: { id: session.ownerId }
    });

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Verify current password
    if (owner.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, owner.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Incorrect current password' },
          { status: 401 }
        );
      }
    } else {
      // If they somehow have no password, they can't change it this way (edge case)
      return NextResponse.json(
        { error: 'Account has no password set. Contact support.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update owner
    await prisma.owner.update({
      where: { id: session.ownerId },
      data: { passwordHash }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
