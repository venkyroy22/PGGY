import { prisma } from './prisma';
import { sendWhatsAppMessage } from './whatsapp';

/**
 * Constants for reminder templates
 * These should match the approved template names in your WhatsApp BSP dashboard.
 */
const TEMPLATES = {
  UPCOMING: 'rent_reminder_upcoming_v1', // e.g. "Hi {1}, your rent of {2} is due on {3}."
  DUE_TODAY: 'rent_reminder_due_today_v1', // e.g. "Hi {1}, your rent of {2} is due today."
  OVERDUE: 'rent_reminder_overdue_v1' // e.g. "Hi {1}, your rent of {2} is overdue. Please pay ASAP."
};

/**
 * Runs the daily reminder engine.
 * Looks for pending rent cycles and sends appropriate WhatsApp reminders.
 */
export async function runReminderEngine() {
  const stats = {
    upcoming: 0,
    dueToday: 0,
    overdue: 0,
    failed: 0
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // 1. Fetch all pending/partial rent cycles with tenant info
    const pendingCycles = await prisma.rentCycle.findMany({
      where: {
        status: { in: ['pending', 'partial'] }
      },
      include: {
        tenant: true
      }
    });

    for (const cycle of pendingCycles) {
      if (!cycle.tenant || cycle.tenant.status !== 'active') continue;

      const dueDate = new Date(cycle.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let templateToUse = null;
      let messageType = null;
      const amountRemaining = cycle.amountDue - cycle.amountPaid;

      // 2. Determine which reminder to send
      if (diffDays === 3) {
        // Due in 3 days
        templateToUse = TEMPLATES.UPCOMING;
        messageType = 'upcoming';
      } else if (diffDays === 0) {
        // Due today
        templateToUse = TEMPLATES.DUE_TODAY;
        messageType = 'due_today';
      } else if (diffDays === -3 || diffDays === -7) {
        // Overdue by 3 or 7 days
        templateToUse = TEMPLATES.OVERDUE;
        messageType = 'overdue';
      }

      // If no reminder is needed today, skip
      if (!templateToUse) continue;

      // Check if we've already sent this type of message for this cycle today
      // (To prevent duplicate crons from spamming)
      const existingLog = await prisma.messageLog.findFirst({
        where: {
          rentCycleId: cycle.id,
          messageType: messageType,
          sentAt: {
            gte: today // Sent today
          }
        }
      });

      if (existingLog) continue; // Already sent today

      // 3. Prepare parameters for the template
      // e.g. [Tenant Name, Amount, Due Date]
      const parameters = [
        cycle.tenant.name.split(' ')[0], // First name
        String(amountRemaining),
        dueDate.toLocaleDateString('en-IN')
      ];

      // 4. Send the message
      const sendResult = await sendWhatsAppMessage(
        cycle.tenant.phone,
        templateToUse,
        parameters
      );

      // 5. Log the result in the database
      await prisma.messageLog.create({
        data: {
          tenantId: cycle.tenant.id,
          rentCycleId: cycle.id,
          messageType,
          status: sendResult.success ? 'sent' : 'failed',
          errorMessage: sendResult.error || null
        }
      });

      if (sendResult.success) {
        if (messageType === 'upcoming') stats.upcoming++;
        else if (messageType === 'due_today') stats.dueToday++;
        else if (messageType === 'overdue') stats.overdue++;
      } else {
        stats.failed++;
      }
    }

    return stats;
  } catch (error) {
    console.error('[Reminder Engine] Fatal error:', error);
    throw error;
  }
}
