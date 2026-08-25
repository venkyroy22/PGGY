import { NextResponse } from 'next/server';
import { generateRentCycles } from '@/lib/rent-generator';

// POST /api/cron/generate-rent
export async function POST(request) {
  try {
    // 1. Authenticate the cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${cronSecret}` && request.headers.get('x-cron-secret') !== cronSecret) {
      // Also allow authenticated manual trigger from frontend (optional depending on needs, 
      // but strictly we should use session for frontend. We'll handle frontend in a different block)
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const year = today.getFullYear();

    // 2. Generate cycles for ALL active tenants across the platform
    // This is meant to be hit by a system-wide daily cron job
    const result = await generateRentCycles(month, year);

    return NextResponse.json({
      success: true,
      message: `Rent cycle generation complete for ${month}/${year}`,
      stats: result
    });
  } catch (error) {
    console.error('[Cron Generate Rent] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
