"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

const FASTAPI_URL = process.env.FASTAPI_SERVICE_URL || "http://127.0.0.1:8000";

export async function resolveDefaultTenantId(preferredTenantId = null) {
  if (preferredTenantId) {
    const existing = await prisma.tenant.findUnique({
      where: { id: preferredTenantId }
    });
    if (existing) return existing.id;
  }

  const firstTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" }
  });
  if (firstTenant) {
    return firstTenant.id;
  }

  const defaultTenant = await prisma.tenant.upsert({
    where: { name: "Airtel Enterprise" },
    update: {},
    create: { name: "Airtel Enterprise" }
  });
  return defaultTenant.id;
}

function sanitizeRiskTier(rawTier) {
  if (!rawTier) return "LOW";
  const normalized = String(rawTier).trim().toUpperCase();
  if (normalized === "CRITICAL" || normalized === "HIGH") {
    return "HIGH";
  }
  if (normalized === "ELEVATED" || normalized === "MEDIUM") {
    return "MEDIUM";
  }
  return "LOW";
}

async function fetchWithRetry(url, options, retries = 3, delay = 200) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
    return response;
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}

export async function executeTelemetryInference(customerId, isFastAPIOffline = false, shouldRevalidate = true, explicitTenantId = null) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new Error("Target customer record not found");
    }

    const targetTenantId = customer.tenantId || explicitTenantId || (await resolveDefaultTenantId());

    const payload = {
      industry: String(customer.industry || "UNKNOWN").toUpperCase(),
      features: {
        monthly_spending: Math.max(0, Number(customer.monthlySpending) || 0),
        inactivity_days: Math.max(0, parseInt(customer.inactivityDays, 10) || 0),
        complaint_count: Math.max(0, parseInt(customer.complaintCount, 10) || 0),
        usage_frequency: Math.max(0, parseInt(customer.usageFrequency, 10) || 0)
      }
    };

    let mlData = null;

    if (!isFastAPIOffline) {
      try {
        const response = await fetchWithRetry(`${FASTAPI_URL}/api/v1/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }, 2, 100);
        mlData = await response.json();
      } catch (apiError) {
        mlData = null;
      }
    }

    if (!mlData) {
      let fallbackProbability = 0.05;
      if (customer.complaintCount > 3) fallbackProbability += 0.45;
      if (customer.inactivityDays > 10) fallbackProbability += 0.25;
      if (customer.usageFrequency < 5) fallbackProbability += 0.15;
      fallbackProbability = Math.min(Math.max(fallbackProbability, 0.01), 0.99);

      const computedTier = fallbackProbability > 0.65 ? "CRITICAL" : fallbackProbability >= 0.35 ? "ELEVATED" : "STABLE";

      mlData = {
        churn_probability: Math.round(fallbackProbability * 1000) / 1000,
        risk_tier: computedTier,
        confidence_score: 0.85,
        shap_values: {
          base_value: 0.18,
          complaint_count_weight: Math.round(customer.complaintCount * 0.42 * 10000) / 10000,
          inactivity_days_weight: Math.round(customer.inactivityDays * 0.05 * 10000) / 10000,
          usage_frequency_weight: Math.round(customer.usageFrequency * -0.15 * 10000) / 10000,
          monthly_spending_weight: Math.round(Number(customer.monthlySpending) * 0.0008 * 10000) / 10000,
          system_status: "FASTAPI_OFFLINE_FALLBACK_APPLIED"
        }
      };
    }

    const sanitizedTier = sanitizeRiskTier(mlData.risk_tier);
    let savedLog = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        savedLog = await prisma.prediction.create({
          data: {
            tenantId: targetTenantId,
            customerId: customer.id,
            churnProbability: Number(mlData.churn_probability),
            riskClassification: sanitizedTier,
            shapExplanations: JSON.stringify(mlData.shap_values)
          }
        });
        if (savedLog) break;
      } catch (err) {
        if (String(err).includes("database is locked") && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }

    if (!savedLog) {
      throw new Error("Failed to persist prediction record to database");
    }

    if (shouldRevalidate) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/predictions");
      revalidatePath("/dashboard/segments");
      revalidatePath("/");
    }

    return {
      success: true,
      predictionId: savedLog.id,
      probability: mlData.churn_probability,
      tier: String(mlData.risk_tier || (sanitizedTier === "HIGH" ? "CRITICAL" : sanitizedTier === "MEDIUM" ? "ELEVATED" : "STABLE")).toUpperCase(),
      riskClassification: savedLog.riskClassification,
      shap: mlData.shap_values
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Pipeline execution failed"
    };
  }
}

export async function exportTelemetryCSVAction(explicitTenantId = null) {
  try {
    const customers = await prisma.customer.findMany({
      where: explicitTenantId ? { tenantId: explicitTenantId } : undefined,
      orderBy: { createdAt: "desc" }
    });

    let csvContent = "accountNode,industry,monthlySpending,inactivityDays,complaintCount,usageFrequency\n";

    customers.forEach((c) => {
      const nodeSafe = c.accountNode.includes(",") ? `"${c.accountNode}"` : c.accountNode;
      const industrySafe = c.industry.includes(",") ? `"${c.industry}"` : c.industry;
      csvContent += `${nodeSafe},${industrySafe},${c.monthlySpending},${c.inactivityDays},${c.complaintCount},${c.usageFrequency}\n`;
    });

    return { success: true, csvData: csvContent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database extraction failed"
    };
  }
}

export async function importTelemetryCSVAction(csvRawText, explicitTenantId = null) {
  try {
    if (!csvRawText || typeof csvRawText !== "string") {
      throw new Error("Empty raw dataset string payload");
    }

    const lines = csvRawText.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length <= 1) {
      throw new Error("No telemetry rows available inside stream payload");
    }

    const targetTenantId = await resolveDefaultTenantId(explicitTenantId);

    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(delimiter).map((h) => h.trim());
    const insertedIds = [];
    const csvSplitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    for (let i = 1; i < lines.length; i++) {
      const row = delimiter === "\t"
        ? lines[i].split("\t").map((val) => val.trim())
        : lines[i].split(csvSplitRegex).map((val) => val.replace(/^"|"$/g, "").trim());

      if (row.length === headers.length && row[0]) {
        const customer = await prisma.customer.upsert({
          where: { accountNode: row[0] },
          update: {
            ...(explicitTenantId ? { tenantId: targetTenantId } : {}),
            industry: row[1] || "UNKNOWN",
            monthlySpending: parseFloat(row[2]) || 0,
            inactivityDays: parseInt(row[3], 10) || 0,
            complaintCount: parseInt(row[4], 10) || 0,
            usageFrequency: parseInt(row[5], 10) || 0
          },
          create: {
            tenantId: targetTenantId,
            accountNode: row[0],
            industry: row[1] || "UNKNOWN",
            monthlySpending: parseFloat(row[2]) || 0,
            inactivityDays: parseInt(row[3], 10) || 0,
            complaintCount: parseInt(row[4], 10) || 0,
            usageFrequency: parseInt(row[5], 10) || 0
          }
        });
        insertedIds.push(customer.id);
      }
    }

    let isFastAPIOffline = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 800);
      const ping = await fetch(`${FASTAPI_URL}/docs`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!ping.ok && ping.status >= 500) {
        isFastAPIOffline = true;
      }
    } catch {
      isFastAPIOffline = true;
    }

    const CHUNK_SIZE = 15;
    for (let i = 0; i < insertedIds.length; i += CHUNK_SIZE) {
      const chunk = insertedIds.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((id) => executeTelemetryInference(id, isFastAPIOffline, false, targetTenantId))
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/predictions");
    revalidatePath("/dashboard/segments");
    revalidatePath("/");

    return { success: true, batchCount: insertedIds.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Dataset parsing failure"
    };
  }
}

export async function flushSystemLogsAction(explicitTenantId = null) {
  try {
    if (explicitTenantId) {
      await prisma.$transaction([
        prisma.prediction.deleteMany({ where: { tenantId: explicitTenantId } }),
        prisma.customer.deleteMany({ where: { tenantId: explicitTenantId } })
      ]);
    } else {
      await prisma.$transaction([
        prisma.prediction.deleteMany(),
        prisma.customer.deleteMany()
      ]);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/predictions");
    revalidatePath("/dashboard/segments");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Truncate failed"
    };
  }
}
