"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { verifyRole, getSession } from "./auth";
import { resolveDefaultTenantId } from "./pipeline";

// --- CUSTOMER CRUD OPERATIONS WITH RBAC & TENANT ENFORCEMENT ---

export async function createCustomer(formData) {
  const isAdmin = await verifyRole("ADMIN");
  if (!isAdmin) return { success: false, error: "UNAUTHORIZED_ACCESS_LEVEL" };

  try {
    const session = await getSession();
    const tenantId = formData.tenantId || session?.tenantId || (await resolveDefaultTenantId());

    const node = await prisma.customer.create({
      data: {
        tenantId,
        accountNode: formData.accountNode,
        industry: formData.industry,
        monthlySpending: parseFloat(formData.monthlySpending),
        inactivityDays: parseInt(formData.inactivityDays, 10),
        complaintCount: parseInt(formData.complaintCount, 10),
        usageFrequency: parseInt(formData.usageFrequency, 10)
      }
    });
    revalidatePath("/dashboard");
    return { success: true, data: node };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id) {
  const isAdmin = await verifyRole("ADMIN");
  if (!isAdmin) return { success: false, error: "UNAUTHORIZED_ACCESS_LEVEL" };

  try {
    const session = await getSession();
    if (session?.tenantId) {
      const existing = await prisma.customer.findUnique({ where: { id } });
      if (!existing || existing.tenantId !== session.tenantId) {
        return { success: false, error: "UNAUTHORIZED_TENANT_RECORD" };
      }
    }

    await prisma.customer.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- CLV & FINANCIAL REVENUE LOSS RISK ANALYSIS ENGINE ---

export async function calculateRevenueRiskMetrics() {
  const session = await getSession();
  const whereClause = session?.tenantId ? { tenantId: session.tenantId } : {};

  const customers = await prisma.customer.findMany({
    where: whereClause,
    include: { predictions: { orderBy: { calculatedAt: "desc" }, take: 1 } }
  });

  let totalPortfolioValue = 0;
  let estimatedRevenueLoss = 0;

  customers.forEach((c) => {
    const spending = parseFloat(c.monthlySpending);
    totalPortfolioValue += spending;

    // Fetch the latest machine learning churn probability score
    const latestPrediction = c.predictions[0];
    if (latestPrediction) {
      // Financial Damage Exposure = Contract Value * Churn Probability Force
      estimatedRevenueLoss += spending * latestPrediction.churnProbability;
    } else if (c.complaintCount > 3) {
      // Fallback heuristics block for uncalculated accounts
      estimatedRevenueLoss += spending * 0.50;
    }
  });

  return {
    totalPortfolioValue: totalPortfolioValue.toFixed(2),
    estimatedRevenueLoss: estimatedRevenueLoss.toFixed(2),
    netSecureRevenue: (totalPortfolioValue - estimatedRevenueLoss).toFixed(2)
  };
}
