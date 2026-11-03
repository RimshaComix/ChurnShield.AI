import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 📥 CSV EXPORT ENDPOINT // GET /api/data
export async function GET() {
  try {
    const activePrisma = prisma || global.prisma;
    if (!activePrisma) throw new Error("Database client connection offline");

    const customers = await activePrisma.customer.findMany({
      orderBy: { createdAt: "desc" }
    });

    let csvContent = "accountNode,industry,monthlySpending,inactivityDays,complaintCount,usageFrequency\n";
    customers.forEach((c) => {
      const nodeSafe = c.accountNode.includes(",") ? `"${c.accountNode}"` : c.accountNode;
      const industrySafe = c.industry.includes(",") ? `"${c.industry}"` : c.industry;
      csvContent += `${nodeSafe},${industrySafe},${c.monthlySpending},${c.inactivityDays},${c.complaintCount},${c.usageFrequency}\n`;
    });

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=telemetry_export.csv",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 500 });
  }
}

// 📤 CSV IMPORT & BATCH INFRASTRUCTURE ENDPOINT // POST /api/data
export async function POST(request) {
  try {
    const activePrisma = prisma || global.prisma;
    const { csvRawText, tenantId: requestedTenantId } = await request.json();
    if (!csvRawText) {
      return NextResponse.json({ error: "Empty raw dataset string payload" }, { status: 400 });
    }

    const lines = csvRawText.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length <= 1) {
      return NextResponse.json({ error: "No telemetry rows available inside stream payload" }, { status: 400 });
    }

    const { resolveDefaultTenantId, executeTelemetryInference } = await import("../../actions/pipeline");
    const targetTenantId = await resolveDefaultTenantId(requestedTenantId);

    const headers = lines[0].split(",");
    const insertedIds = [];
    const csvSplitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(csvSplitRegex).map((val) => val.replace(/^"|"$/g, "").trim());

      if (row.length === headers.length && row[0]) {
        const customer = await activePrisma.customer.upsert({
          where: { accountNode: row[0] },
          update: {
            ...(requestedTenantId ? { tenantId: targetTenantId } : {}),
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

    const batchRuns = insertedIds.map((id) => executeTelemetryInference(id, false, false, targetTenantId));
    await Promise.all(batchRuns);

    return NextResponse.json({ success: true, batchCount: insertedIds.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 500 });
  }
}
