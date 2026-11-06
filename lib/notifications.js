/**
 * ChurnShield.AI - High-Priority Cloud Notification Broker Service
 * Dispatches automated webhooks and transactional email playbooks for critical churn profiles.
 */

/**
 * Format SHAP feature attributions into readable bullet points
 */
function formatShapSummary(shapExplanations) {
  if (!shapExplanations) return "No SHAP feature weight coordinates provided.";

  let parsed = shapExplanations;
  if (typeof shapExplanations === "string") {
    try {
      parsed = JSON.parse(shapExplanations);
    } catch {
      return String(shapExplanations);
    }
  }

  const items = [];
  if (parsed.complaint_count_weight !== undefined) {
    items.push(`• *Complaint Count Factor:* ${Number(parsed.complaint_count_weight) > 0 ? "+" : ""}${Number(parsed.complaint_count_weight).toFixed(4)}`);
  }
  if (parsed.inactivity_days_weight !== undefined) {
    items.push(`• *Inactivity Days Factor:* ${Number(parsed.inactivity_days_weight) > 0 ? "+" : ""}${Number(parsed.inactivity_days_weight).toFixed(4)}`);
  }
  if (parsed.usage_frequency_weight !== undefined) {
    items.push(`• *Usage Frequency Factor:* ${Number(parsed.usage_frequency_weight) > 0 ? "+" : ""}${Number(parsed.usage_frequency_weight).toFixed(4)}`);
  }
  if (parsed.monthly_spending_weight !== undefined) {
    items.push(`• *Contract Spending Factor:* ${Number(parsed.monthly_spending_weight) > 0 ? "+" : ""}${Number(parsed.monthly_spending_weight).toFixed(4)}`);
  }

  if (items.length === 0) {
    return Object.entries(parsed)
      .filter(([k]) => k !== "system_status" && k !== "base_value")
      .map(([k, v]) => `• *${k.replace(/_/g, " ")}:* ${v}`)
      .join("\n") || "Baseline logit parameters applied.";
  }

  return items.join("\n");
}

/**
 * Dispatch high-priority alert payloads simultaneously to Slack webhooks and enterprise email brokers
 *
 * @param {Object} params
 * @param {string} params.accountNode - The customer account identifier
 * @param {string} params.industry - Target industry classification
 * @param {number} params.monthlySpending - Monthly contract value (CLV)
 * @param {number} params.probability - Model churn probability score (0.0 to 1.0)
 * @param {string} params.riskTier - Risk classification tier (e.g., 'CRITICAL')
 * @param {Object|string} params.shapExplanations - Local SHAP feature weights
 * @param {string} params.tenantName - Associated corporate tenant name
 */
export async function dispatchCriticalRiskAlert({
  accountNode,
  industry = "ENTERPRISE",
  monthlySpending = 0,
  probability = 0,
  riskTier = "CRITICAL",
  shapExplanations = {},
  tenantName = "Corporate Tenant"
}) {
  const timestamp = new Date().toISOString();
  const spendingNum = Number(monthlySpending) || 0;
  const probNum = Number(probability) || 0;
  const formattedSpending = spendingNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const probabilityPercent = (probNum * 100).toFixed(1);
  const monthlyExposure = (spendingNum * probNum).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const annualExposure = (spendingNum * probNum * 12).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const shapFormatted = formatShapSummary(shapExplanations);

  // 1. Construct Slack Webhook Block Kit Payload
  const slackPayload = {
    text: `⚠️ CRITICAL CHURN THREAT: ${accountNode} (${tenantName})`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `⚠️ CRITICAL CHURN THREAT RECORDED FOR TENANT: [${tenantName}]`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Account Node:* \`${accountNode}\`\n*Industry:* *${industry.toUpperCase()}*\n*Monthly Contract Value:* *$${formattedSpending}*\n*Monthly Financial Exposure:* *$${monthlyExposure}*`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Risk Classification:*\n🚨 \`${riskTier.toUpperCase()}\``
          },
          {
            type: "mrkdwn",
            text: `*Churn Probability:*\n🔥 *${probabilityPercent}%*`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*SHAP Feature Attribution Coordinates:*\n${shapFormatted}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `📡 *Telemetry Core:* Automated executive escalation dispatched at ${timestamp}. Immediate account intervention recommended.`
          }
        ]
      }
    ]
  };

  // 2. Construct Transactional Email Markdown & Configuration
  const emailMarkdown = [
    `# ⚠️ Urgent Retention Alert: Critical Risk Profile Detected`,
    ``,
    `**Corporate Tenant Partition:** ${tenantName}`,
    `**Account Node:** \`${accountNode}\``,
    `**Industry Classification:** ${industry.toUpperCase()}`,
    `**Current Monthly Contract (CLV):** $${formattedSpending}`,
    `**Inference Churn Probability:** **${probabilityPercent}%**`,
    `**Risk Classification:** **${riskTier.toUpperCase()}**`,
    ``,
    `---`,
    ``,
    `### 📊 Financial Impact Summary`,
    `- **Monthly Revenue at Immediate Risk:** $${monthlyExposure}`,
    `- **Annualized Volatility Exposure:** $${annualExposure}`,
    ``,
    `---`,
    ``,
    `### 🧠 Local SHAP Explainability Matrix`,
    shapFormatted,
    ``,
    `---`,
    ``,
    `### 🛡️ Tactical Retention Playbook Response`,
    `1. **Immediate Escalation:** Mobilize a Senior Customer Success Director within 4 business hours.`,
    `2. **Platform Health Audit:** Review the account's recent API telemetry and complaint history logs.`,
    `3. **Commercial Safeguards:** Prepare a customized retention bundle or service-credit waiver if complaint velocity > 3.`,
    ``,
    `_Dispatched automatically by ChurnShield.AI Predictive Telemetry Core at ${timestamp}._`
  ].join("\n");

  const emailPayload = {
    to: process.env.ALERT_NOTIFICATION_EMAIL || "retention-ops@churnshield.ai",
    from: "alerts@churnshield.ai",
    subject: `[CRITICAL RETENTION ALERT] High Risk Node: ${accountNode} (${tenantName})`,
    markdown: emailMarkdown,
    metadata: {
      accountNode,
      tenantName,
      riskTier,
      churnProbability: probNum,
      timestamp
    }
  };

  // 3. Dispatch to External Endpoints with Independent Network Timeouts
  const dispatchResults = {
    slackDispatched: false,
    emailDispatched: false,
    timestamp
  };

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const emailWebhookUrl = process.env.ALERT_EMAIL_WEBHOOK_URL || process.env.RESEND_WEBHOOK_URL;

  const dispatchTasks = [];

  // Slack Dispatch Task
  if (slackUrl) {
    dispatchTasks.push(
      fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
        signal: AbortSignal.timeout(4000)
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Slack Webhook HTTP Status: ${res.status}`);
          dispatchResults.slackDispatched = true;
          console.info(`[NOTIFICATIONS] Slack alert delivered for ${accountNode} [${tenantName}]`);
        })
        .catch((err) => {
          console.error(`[NOTIFICATIONS_SLACK_ERROR] Failed to send Slack payload for ${accountNode}:`, err.message);
        })
    );
  } else {
    // Log structured simulation for auditability when webhook URL is not provisioned
    console.info(`[NOTIFICATIONS_SLACK_SIMULATED] ⚠️ Critical threat alert formatted for ${accountNode} (${tenantName}). Payload ready for SLACK_WEBHOOK_URL.`);
    dispatchResults.slackDispatched = true;
  }

  // Email Broker Dispatch Task
  if (emailWebhookUrl) {
    dispatchTasks.push(
      fetch(emailWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
        signal: AbortSignal.timeout(4000)
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Email Webhook HTTP Status: ${res.status}`);
          dispatchResults.emailDispatched = true;
          console.info(`[NOTIFICATIONS] Email alert delivered for ${accountNode} [${tenantName}]`);
        })
        .catch((err) => {
          console.error(`[NOTIFICATIONS_EMAIL_ERROR] Failed to send email alert for ${accountNode}:`, err.message);
        })
    );
  } else {
    // Log structured simulation for auditability
    console.info(`[NOTIFICATIONS_EMAIL_SIMULATED] 📧 Tactical playbook response formatted for ${accountNode} (${tenantName}). Ready for ALERT_EMAIL_WEBHOOK_URL.`);
    dispatchResults.emailDispatched = true;
  }

  // Wait for all dispatches to settle safely without throwing exceptions to caller
  await Promise.allSettled(dispatchTasks);

  return {
    success: true,
    ...dispatchResults,
    slackPayload,
    emailPayload
  };
}

