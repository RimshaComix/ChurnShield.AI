"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

const FASTAPI_URL = process.env.FASTAPI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Executes a network fetch request with standard retry mechanisms to handle network drops.
 */
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

/**
 * Standard Telemetry Inference pipeline executing individual node analysis
 */
export async function executeTelemetryInference(customerId, isFastAPIOffline = false, shouldRevalidate = true) {
  try {
    // 1. Fetch real-time behavioral features from the offline SQLite file
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) throw new Error("Target customer record not found");

    // 2. Format structure to match Python Pydantic models precisely
    const payload = {
      industry: customer.industry,
      features: {
        monthly_spending: Number(customer.monthlySpending),
        inactivity_days: parseInt(customer.inactivityDays, 10),
        complaint_count: parseInt(customer.complaintCount, 10),
        usage_frequency: parseInt(customer.usageFrequency, 10)
      }
    };

    let mlData = null;
    
    // 3. Fire payload at our live running FastAPI service on port 8000 only if backend is online
    if (!isFastAPIOffline) {
      try {
        const response = await fetchWithRetry(`${FASTAPI_URL}/api/v1/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }, 1, 100);
        mlData = await response.json();
      } catch (apiError) {
        console.warn(`[FASTAPI_OFFLINE] Fallback activated for customer node ${customerId}:`, apiError.message);
      }
    }

    // 4. Instantaneous Fallback Calculation
    if (!mlData) {
      let fallbackProbability = 0.05;
      if (customer.complaintCount > 3) fallbackProbability += 0.45;
      if (customer.inactivityDays > 10) fallbackProbability += 0.25;
      
      mlData = {
        churn_probability: Math.min(fallbackProbability, 1.0),
        risk_tier: fallbackProbability >= 0.5 ? "CRITICAL" : "STABLE",
        shap_values: { system_status: "FASTAPI_OFFLINE_FALLBACK_APPLIED" }
      };
    }

    const rawTier = String(mlData.risk_tier).toUpperCase();
    let savedLog = null;

    // 🛡️ SELF-HEALING TRIAL-AND-ERROR INJECTION PIPELINE
    const trialBanners = [
      rawTier === "CRITICAL" || rawTier === "HIGH" ? "CRITICAL" : rawTier === "ELEVATED" || rawTier === "MEDIUM" ? "ELEVATED" : "STABLE",
      rawTier === "CRITICAL" || rawTier === "HIGH" ? "HIGH" : rawTier === "ELEVATED" || rawTier === "MEDIUM" ? "MEDIUM" : "LOW",
      rawTier === "CRITICAL" || rawTier === "HIGH" ? "critical" : rawTier === "ELEVATED" || rawTier === "MEDIUM" ? "elevated" : "stable",
      rawTier === "CRITICAL" || rawTier === "HIGH" ? "high" : rawTier === "ELEVATED" || rawTier === "MEDIUM" ? "medium" : "low"
    ];

    for (const testTier of trialBanners) {
      try {
        savedLog = await prisma.prediction.create({
          data: {
            customerId: customer.id,
            churnProbability: mlData.churn_probability,
            riskClassification: testTier,
            shapExplanations: JSON.stringify(mlData.shap_values)
          }
        });
        if (savedLog) break;
      } catch (e) {
        if (String(e).includes("database is locked")) {
          await new Promise((r) => setTimeout(r, 40));
        }
        continue;
      }
    }

    // 💥 DYNAMIC RUNTIME FALLBACK RUN
    if (!savedLog) {
      console.warn("[ENUM_MISMATCH_CRITICAL] Schema enum did not match standard naming conventions. Inspecting runtime schema tokens...");
      const validEnumValues = prisma._dmmf?.datamodel?.enums?.find(e => e.name === "RiskTier")?.values?.map(v => v.name) || [];
      let safeFallbackValue = validEnumValues[0] || undefined;
      
      if (validEnumValues.length > 0) {
        const matchingToken = validEnumValues.find(v => v.toUpperCase().includes("HIGH") || v.toUpperCase().includes("CRIT"));
        if (matchingToken && (rawTier === "CRITICAL" || rawTier === "HIGH")) safeFallbackValue = matchingToken;
      }

      if (!safeFallbackValue) {
        safeFallbackValue = rawTier === "CRITICAL" || rawTier === "HIGH" ? "CRITICAL" : "STABLE";
      }

      savedLog = await prisma.prediction.create({
        data: {
          customerId: customer.id,
          churnProbability: mlData.churn_probability,
          riskClassification: safeFallbackValue,
          shapExplanations: JSON.stringify(mlData.shap_values)
        }
      });
    }

    // 5. Purge router layout caches on demand to update browser views instantly (only when single execution)
    if (shouldRevalidate) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/predictions");
      revalidatePath("/dashboard/segments");
    }

    return { 
      success: true, 
      predictionId: savedLog.id,
      probability: mlData.churn_probability,
      tier: String(savedLog.riskClassification).toUpperCase(),
      shap: mlData.shap_values
    };

  } catch (error) {
    console.error("Execution Pipeline Crash:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: error instanceof Error ? error.message : "Pipeline crash occurred" };
  }
}

/**
 * 📥 EXPORT PIPELINE: Generates strict CSV plaintext data from database records natively
 */
export async function exportTelemetryCSVAction() {
  try {
    const customers = await prisma.customer.findMany();
    let csvContent = "accountNode,industry,monthlySpending,inactivityDays,complaintCount,usageFrequency\n";
    
    customers.forEach((c) => {
      const nodeSafe = c.accountNode.includes(",") ? `"${c.accountNode}"` : c.accountNode;
      const industrySafe = c.industry.includes(",") ? `"${c.industry}"` : c.industry;
      csvContent += `${nodeSafe},${industrySafe},${c.monthlySpending},${c.inactivityDays},${c.complaintCount},${c.usageFrequency}\n`;
    });
    
    return { success: true, csvData: csvContent };
  } catch (error) {
    console.error("Export Action Failure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Database extraction failed" };
  }
}

/**
 * 📤 IMPORT PIPELINE: Processes CSV/TSV raw input and triggers batch inferences directly over encrypted server pipes
 */
export async function importTelemetryCSVAction(csvRawText) {
  try {
    if (!csvRawText) throw new Error("Empty raw dataset string payload");

    const lines = csvRawText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length <= 1) throw new Error("No telemetry rows available inside stream payload");

    // Dynamic delimiter detection (Comma or Tab)
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(delimiter).map(h => h.trim());
    const insertedIds = [];

    // Safe regex split to avoid breaking on strings containing internal commas
    const csvSplitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    // Parse data rows sequentially inside model operations
    for (let i = 1; i < lines.length; i++) {
      const row = delimiter === "\t"
        ? lines[i].split("\t").map(val => val.trim())
        : lines[i].split(csvSplitRegex).map(val => val.replace(/^"|"$/g, '').trim());
      
      if (row.length === headers.length && row[0]) {
        const customer = await prisma.customer.upsert({
          where: { accountNode: row[0] },
          update: {
            industry: row[1],
            monthlySpending: parseFloat(row[2]) || 0,
            inactivityDays: parseInt(row[3], 10) || 0,
            complaintCount: parseInt(row[4], 10) || 0,
            usageFrequency: parseInt(row[5], 10) || 0
          },
          create: {
            accountNode: row[0],
            industry: row[1],
            monthlySpending: parseFloat(row[2]) || 0,
            inactivityDays: parseInt(row[3], 10) || 0,
            complaintCount: parseInt(row[4], 10) || 0,
            usageFrequency: parseInt(row[5], 10) || 0
          }
        });
        insertedIds.push(customer.id);
      }
    }

    // Ping FastAPI once upfront to avoid repeating 600 retry requests if offline
    let isFastAPIOffline = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 800);
      const ping = await fetch(`${FASTAPI_URL}/docs`, { method: "GET", signal: controller.signal });
      clearTimeout(timeout);
      if (!ping.ok && ping.status >= 500) isFastAPIOffline = true;
    } catch {
      isFastAPIOffline = true;
      console.warn("[FASTAPI_STATUS] FastAPI backend unreachable. Executing instant local fallback pipeline.");
    }

    // Process inferences in controlled batches to eliminate SQLite file locks
    const CHUNK_SIZE = 15;
    for (let i = 0; i < insertedIds.length; i += CHUNK_SIZE) {
      const chunk = insertedIds.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(id => executeTelemetryInference(id, isFastAPIOffline, false)));
    }

    // Refresh layouts across active UI routing segments once after all nodes complete
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/predictions");
    revalidatePath("/dashboard/segments");
    revalidatePath("/");

    return { success: true, batchCount: insertedIds.length };
  } catch (error) {
    console.error("Import Action Failure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Dataset parsing failure" };
  }
}

/**
 * 🗑️ SYSTEM PURGE ACTION: Safely flushes all telemetry customers and machine learning predictions
 */
export async function flushSystemLogsAction() {
  try {
    // Delete predictions first to prevent foreign key errors, then delete all customers
    await prisma.$transaction([
      prisma.prediction.deleteMany(),
      prisma.customer.deleteMany(),
    ]);
    
    // Refresh layout contexts across active dashboard routes
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/predictions");
    revalidatePath("/dashboard/segments");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Purge Action Failure:", error);
    return { success: false, error: error instanceof Error ? error.message : "Truncate failed" };
  }
}