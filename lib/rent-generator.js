import { prisma } from './prisma';

/**
 * Generates rent cycles for all active tenants for the specified month and year.
 * This function is idempotent — it will not create duplicate cycles for the same month/year.
 * 
 * @param {number} month - 1-12
 * @param {number} year - e.g. 2026
 * @param {string} [ownerId] - Optional. If provided, only generates for this owner's tenants.
 * @returns {Object} { created: number, existing: number, errors: number }
 */
export async function generateRentCycles(month, year, ownerId = null) {
  const result = {
    created: 0,
    existing: 0,
    errors: 0
  };

  try {
    // 1. Find all active tenants and filter by owner
    const activeTenants = await prisma.tenant.findMany({
      where: { 
        status: 'active',
        billingType: 'MONTHLY',
        bed: { isNot: null },
        ...(ownerId ? { property: { ownerId } } : {})
      },
      include: {
        bed: {
          include: {
            room: {
              include: { property: true }
            }
          }
        }
      }
    });

    // 2. For each tenant, ensure a rent cycle exists
    for (const tenant of activeTenants) {
      if (!tenant.bed) continue; // Should not happen for active tenants, but just in case

      try {
        // Check if cycle exists
        const existingCycle = await prisma.rentCycle.findFirst({
          where: {
            tenantId: tenant.id,
            month,
            year
          }
        });

        if (existingCycle) {
          result.existing++;
          continue;
        }

        // Calculate due date based on tenant's dueDay
        let dueDate = new Date(year, month - 1, tenant.dueDay);
        
        // If the calculated due date is in the past for this month, that's fine.
        // E.g., if generated on 5th but due on 1st.

        await prisma.rentCycle.create({
          data: {
            tenantId: tenant.id,
            month,
            year,
            billingStartDate: new Date(year, month - 1, 1),
            billingEndDate: new Date(year, month, 0), // Last day of the month
            amountDue: tenant.agreedRent || tenant.bed?.monthlyRent || 0,
            status: 'pending',
            dueDate
          }
        });

        result.created++;
      } catch (err) {
        console.error(`[RentGenerator] Error generating cycle for tenant ${tenant.id}:`, err);
        result.errors++;
      }
    }

    return result;
  } catch (error) {
    console.error('[RentGenerator] Fatal error:', error);
    throw error;
  }
}
