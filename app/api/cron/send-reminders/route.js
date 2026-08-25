import { NextResponse } from 'next/server';
import { runReminderEngine } from '@/lib/reminder-engine';

// POST /api/cron/send-reminders
export async function POST(request) {
  try {
    // 1. Authenticate the cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${cronSecret}` && request.headers.get('x-cron-secret') !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    // 2. Run the reminder engine
    // This is meant to be hit by a system-wide daily cron job (e.g. at 10 AM)
    const stats = await runReminderEngine();

    return NextResponse.json({
      success: true,
      message: 'Reminder engine executed successfully',
      stats
    });
  } catch (error) {
    console.error('[Cron Send Reminders] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
