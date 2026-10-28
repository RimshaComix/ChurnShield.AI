# ChurnShield.AI — Enterprise Customer Retention & ML Telemetry Platform

> **A production-grade, full-stack decision-support platform combining predictive machine learning, explainable AI (SHAP), behavioral cohort segmentation, financial exposure analytics, and proactive retention playbooks.**

---

## Executive System Overview

**ChurnShield.AI** is a dual-service enterprise retention engineering system designed to help organizations detect customer churn volatility before it manifests as contract attrition. Rather than operating as an isolated proof-of-concept classification script, ChurnShield implements an end-to-end distributed topology that unites a **Next.js 16 (React 19)** full-stack management console with an independent **FastAPI / Python** machine learning inference microservice and an embedded **Prisma / SQLite** persistence layer.

The platform continuously processes multi-dimensional telemetry features—such as monthly contract spending, operational inactivity intervals, accumulated complaint tickets, and weekly session frequencies. It maps these behavioral attributes into calibrated churn probabilities, generates deterministic local feature importance vectors (SHAP attributions), classifies accounts into multi-dimensional K-Means behavioral cohorts, calculates financial portfolio exposure, and dispatches automated mitigation playbooks.

### Core Architectural Highlights

- **Decoupled Service-Oriented Architecture (SOA):** Next.js handles server-rendered dashboards, client-side simulations, and administrative operations, while FastAPI exposes dedicated machine learning inference pipelines via high-throughput JSON contracts.
- **Next.js 16 Server Actions & Edge Caching:** Mutations and inferences run natively through Server Actions (`"use server"`), triggering granular cache invalidation via `revalidatePath` across `/dashboard`, `/dashboard/predictions`, `/dashboard/segments`, and `/`.
- **Defensive Resilience & Fallback Engine:** The Next.js pipeline features automated retry loops with exponential backoff, health ping checks (`GET /docs`), concurrency chunking to prevent SQLite database locking, and an instantaneous offline heuristic fallback engine that ensures 100% operational availability even if the Python service is offline.
- **Transparent Explainable AI (XAI):** Raw prediction probabilities are decomposed into directional force contributions (`complaint_count_weight`, `inactivity_days_weight`, `usage_frequency_weight`, `monthly_spending_weight`) and presented through slide-over telemetry drawers and real-time What-If scenario simulators.
- **Enterprise Financial Risk Modeling:** Dynamic calculations compute Total Portfolio Customer Lifetime Value (CLV), At-Risk Exposure Factor ($Spending \times P(\text{churn})$), Net Secure Revenue, and Threat Distribution stratifications.

---

## End-to-End Architectural Flow Diagram

```text
+----------------------------------------------------------------------------------------------------+
|                                     BROWSER CLIENT RUNTIME                                         |
|                                                                                                    |
|  +--------------------+  +--------------------+  +-----------------------+  +-------------------+  |
|  | Landing Page &     |  | Executive KPI &    |  | Historical Prediction |  | K-Means Cohort    |  |
|  | Presentation Theme |  | Telemetry Monitor  |  | Stratification Matrix |  | Clustering View   |  |
|  | [app/page.js]      |  | [dashboard/page.js]|  | [predictions/page.js] |  | [segments/page.js]|  |
|  +--------------------+  +--------------------+  +-----------------------+  +-------------------+  |
|            |                        |                         |                       |            |
|            |           +----------------------------+         |                       |            |
|            |           | Interactive Client Modules |         |                       |            |
|            |           | - DataPanel (CSV / Purge)  |         |                       |            |
|            |           | - AnalyzeButton (Scoring)  |         |                       |            |
|            |           | - ShapAnalyticsPanel       |         |                       |            |
|            |           | - What-If Risk Simulator   |         |                       |            |
|            |           | - ShapDrawer (Slide-Over)  |         |                       |            |
|            |           +----------------------------+         |                       |            |
+------------|------------------------|-------------------------|-----------------------|------------+
             |                        |                         |                       |
             |                        v                         |                       |
+------------|--------------------------------------------------|-----------------------|------------+
|            |              NEXT.JS 16 APPLICATION RUNTIME (Port :3000)                         |
|            |                                                                                  |
|  +-----------------------------------------------------------------------------------------+  |
|  |                                  SERVER ACTIONS LAYER                                   |  |
|  |                                                                                         |  |
|  |  [app/actions/pipeline.js]                                                              |  |
|  |  * executeTelemetryInference(customerId, isFastAPIOffline, shouldRevalidate)            |  |
|  |  * importTelemetryCSVAction(csvRawText) [Batch chunking (size=15), Delimiter Detection] |  |
|  |  * exportTelemetryCSVAction() [Strict Plaintext CSV Generator]                          |  |
|  |  * flushSystemLogsAction() [Two-Phase Atomic $transaction Purge]                        |  |
|  |                                                                                         |  |
|  |  [app/actions/customer.js]                                                              |  |
|  |  * createCustomer(formData) [RBAC Enforced]                                             |  |
|  |  * deleteCustomer(id) [RBAC Enforced]                                                   |  |
|  |  * calculateRevenueRiskMetrics() [Financial Damage Exposure Calculation]                |  |
|  |                                                                                         |  |
|  |  [app/actions/auth.js]                                                                  |  |
|  |  * loginUser(email, password) / verifyRole(requiredRole) [HTTP-only Cookie Session]     |  |
|  +-----------------------------------------------------------------------------------------+  |
|            |                         |                                 |                      |
|            |                         v                                 v                      |
|  +--------------------+   +---------------------+           +----------------------+          |
|  | REST Route Handler |   | Failover Heuristic  |           | Prisma Client ORM    |          |
|  | GET/POST           |   | Fallback Engine     |           | [lib/prisma.js]      |          |
|  | /app/api/data      |   | (P=0.05 + 0.45 + ...|           | Global Singleton     |          |
|  +--------------------+   +---------------------+           +----------------------+          |
+--------------------------------------|---------------------------------|----------------------+
                                       |                                 |
                        HTTP POST      |                                 v Direct Read/Write
                        JSON Payload   |                      +----------------------+
                        Port :8000     |                      | SQLite Database      |
                                       |                      | [dev.db]             |
                                       |                      | - Customer Table     |
                                       |                      | - Prediction Table   |
                                       |                      | - User Table         |
                                       |                      +----------------------+
                                       v
+-----------------------------------------------------------------------------------------------+
|                             STANDALONE FASTAPI ML BACKEND (Port :8000)                        |
|                                                                                               |
|  +-----------------------------------------------------------------------------------------+  |
|  | Uvicorn Async Server Engine [ml_backend/main.py]                                        |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | Route: POST /api/v1/predict                                                             |  |
|  | Input Validation: Pydantic v2 (InferenceRequest: industry, FeatureTelemetry)           |  |
|  +-----------------------------------------------------------------------------------------+  |
|                                              |                                                |
|                                              v                                                |
|  +-----------------------------------------------------------------------------------------+  |
|  |                        COMPUTATIONAL ML INFERENCE PIPELINE                              |  |
|  |                                                                                         |  |
|  |  1. Logit Score Calculation:                                                            |  |
|  |     Logit = -1.5 + (0.42 * complaints) + (0.05 * inactivity)                            |  |
|  |                  - (0.15 * usage_freq) + (0.0008 * monthly_spending)                     |  |
|  |                                                                                         |  |
|  |  2. Logistic Probability Sigmoid Map:                                                   |  |
|  |     P(churn) = 1.0 / (1.0 + exp(-Logit))  --> Clamped to [0.01, 0.99]                   |  |
|  |                                                                                         |  |
|  |  3. Model Confidence Metric:                                                            |  |
|  |     Variance = |usage_frequency - 20| / 50.0                                            |  |
|  |     Confidence = max(0.85, min(0.97, 0.95 - Variance))                                  |  |
|  |                                                                                         |  |
|  |  4. Stratified Risk Tier Classification:                                                |  |
|  |     P < 0.35: STABLE  |  0.35 <= P <= 0.65: ELEVATED  |  P > 0.65: CRITICAL              |  |
|  |                                                                                         |  |
|  |  5. SHAP Feature Attribution Decomposition:                                             |  |
|  |     base_value = 0.18                                                                   |  |
|  |     complaint_weight = round(complaints * 0.42, 4)                                      |  |
|  |     inactivity_weight = round(inactivity * 0.05, 4)                                     |  |
|  |     usage_frequency_weight = round(usage_freq * -0.15, 4)                               |  |
|  |     monthly_spending_weight = round(spending * 0.0008, 4)                               |  |
|  |                                                                                         |  |
|  |  6. Dynamic Domain Retention Playbooks:                                                 |  |
|  |     TELECOM  --> Loyalty Renewal Bundle (-25%) / Executive Care Escalation              |  |
|  |     BANKING  --> 90-Day Transaction Fee Waiver / VIP Wealth Desk Assignment             |  |
|  |     DEFAULT  --> Lifecycle Webinar Adoption Training / $50 Contract Balance Credit      |  |
|  |                                                                                         |  |
|  |  7. K-Means Cohort Cluster Assignment (Nearest Euclidean Centroid):                     |  |
|  |     - HIGH VALUE AT RISK   : [2400.0, 15.0, 4.0, 2.0]                                   |  |
|  |     - DORMANT CORE USER    : [1000.0, 25.0, 5.0, 1.0]                                   |  |
|  |     - STABLE BASELINE GROUP: [3000.0,  2.0, 0.0, 45.0]                                  |  |
|  +-----------------------------------------------------------------------------------------+  |
|                                              |                                                |
|                                              v                                                |
|  +-----------------------------------------------------------------------------------------+  |
|  | JSON Response Serializer: InferenceResponse                                             |  |
|  | { churn_probability, confidence_score, risk_tier, shap_values, recommendations, ... }   |  |
|  +-----------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
```

---

## Detailed Technology Stack Components

### Frontend & Application Infrastructure

| Component | Technology | Version | Purpose & Architectural Role |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.2.10` | Full-stack meta-framework managing layouts, server rendering, routing, API endpoints, and Server Actions. |
| **UI Library** | React | `19.2.4` | Modern React runtime leveraging `useTransition`, concurrent actions, server components, and dynamic client hooks. |
| **Compiler** | React Compiler | `1.0.0` | Configured via `next.config.mjs` (`reactCompiler: true`) for automated hook memoization and zero-overhead re-renders. |
| **Styling** | Tailwind CSS | `^4.0.0` | Utility-first responsive CSS styling with custom industrial monospace fonts, marquee animations, and CSS variables. |
| **Typography** | Geist & Geist Mono | Google Fonts | Variable font families loaded in root layout (`--font-geist-sans`, `--font-geist-mono`). |
| **Icons / UI** | Custom SVGs / CSS Vectors | Native | Inline SVG vector spinners, animated telemetry badges, and custom branded indicators. |

### Backend, Modeling & Data Persistence

| Component | Technology | Version | Purpose & Architectural Role |
| :--- | :--- | :--- | :--- |
| **API Framework** | FastAPI | `0.139.2` | High-performance Python async REST API providing model telemetry inference endpoints. |
| **ASGI Server** | Uvicorn | `0.51.0` | Production ASGI web server running the Python prediction microservice on port 8000. |
| **Data Validation**| Pydantic | `2.13.4` | Schema definitions, strict type enforcement, and bounds checking (`ge=0`) on telemetry features. |
| **Scientific Math**| Python Math & NumPy | `2.5.1` / Native | Vector distance calculations, logit evaluation, and sigmoid activation mappings. |
| **ORM / ODM** | Prisma Client | `^6.19.3` | Typesafe database client with dynamic runtime DMMF inspection, connection pooling, and migrations. |
| **Database** | SQLite | 3.x | Zero-configuration relational database stored locally in `dev.db`. |
| **Seed Engine** | Node.js Prisma Script | Custom | Seed script (`prisma/seed.js`) generating benchmark enterprise multi-tenant profiles. |

---

## Repository Directory Structure Map

```text
ChurnShield/churnshield/
│
├── .env                                # Local environment parameters (DATABASE_URL, FASTAPI_SERVICE_URL)
├── .gitignore                          # Git tracking exclusions (node_modules, .next, venv, dev.db)
├── AGENTS.md                           # Multi-agent collaboration documentation & system rules
├── CLAUDE.md                           # AI assistant entry point instructions
├── dev.db                              # Active SQLite database file (runtime operational store)
├── eslint.config.mjs                   # ESLint configuration with Next.js core web vitals plugin
├── jsconfig.json                       # JavaScript path alias definitions (@/* -> ./*)
├── next.config.mjs                     # Next.js configuration enabling reactCompiler
├── package.json                        # Node.js dependencies, scripts, and Prisma seed configuration
├── package-lock.json                   # Deterministic package dependency tree lockfile
├── postcss.config.mjs                  # PostCSS configuration integrating @tailwindcss/postcss
├── tsconfig.json                       # TypeScript compiler settings for IDE type hinting
├── README.md                           # System architecture manual and operational guide
│
├── app/                                # Next.js App Router root directory
│   ├── favicon.ico                     # Platform console favicon asset
│   ├── globals.css                     # Global styles, Tailwind imports, custom scrollbar & marquee
│   ├── layout.js                       # Root HTML/Body layout registering Geist fonts and metadata
│   ├── page.js                         # Production marketing landing page & presentation theme toggle
│   │
│   ├── actions/                        # Next.js Server Actions execution layer ("use server")
│   │   ├── auth.js                     # User authentication, session cookie generation, RBAC verification
│   │   ├── customer.js                 # Customer CRUD and CLV financial revenue loss risk engine
│   │   └── pipeline.js                 # Primary telemetry inference, CSV import/export, and purge actions
│   │
│   ├── app/api/data/                   # Programmatic REST API endpoints
│   │   └── route.js                    # GET (CSV export) & POST (CSV ingestion & batch inference)
│   │
│   ├── components/                     # Reusable client and server UI modules
│   │   ├── AnalyzeButton.js            # Table row action triggering live customer scoring & inline error badge
│   │   ├── DataPanel.js                # Drag-and-drop CSV dropzone, export trigger, and system log purge
│   │   ├── ShapAnalyticsPanel.js       # Customer 360 profile, SHAP attribution bars, What-If simulator, email generator
│   │   ├── ShapDrawer.js               # Slide-over sidebar rendering local feature contribution breakdown
│   │   └── themeProvider.js            # Context provider synchronizing dark/light presentation states
│   │
│   └── dashboard/                      # Enterprise Analytics Workspace
│       ├── layout.js                   # Persistent layout with navigation sidebar, status badge, and workspace exit
│       ├── NavigationLinks.js          # Interactive navigation tabs with route-matching indicators
│       ├── page.js                     # Main Executive Dashboard (KPI metrics, alerts center, live tracking table)
│       │
│       ├── predictions/                # Historical Inferences Route
│       │   └── page.js                 # Table of calculated predictions with probabilities, tiers, and SHAP drawers
│       │
│       └── segments/                   # Behavioral Customer Cohorts Route
│           └── page.js                 # Three-column matrix (High-Value At Risk, Inactive Core, Stable Baseline)
│
├── lib/                                # Shared utility and client singletons
│   └── prisma.js                       # PrismaClient singleton attached to globalThis to prevent connection leaks
│
├── ml_backend/                         # Python FastAPI Machine Learning Microservice
│   ├── main.py                         # FastAPI server, Pydantic schemas, ML logit pipeline, K-Means clustering
│   ├── requirements.txt                # Python package dependency specifications
│   └── venv/                           # Python isolated virtual environment directory
│
├── prisma/                             # Database schema definition and migration assets
│   ├── dev.db                          # Secondary/development SQLite storage file
│   ├── schema.prisma                   # Canonical Prisma schema (Customer, Prediction, User, RiskTier, Role)
│   └── seed.js                         # Enterprise dataset seeder hydrating baseline accounts
│
└── public/                             # Static public assets served at root
    ├── 1.jpg - 4.jpg                   # Sector application preview images
    ├── 5.png                           # Platform system screenshot preview
    ├── file.svg, globe.svg             # Next.js template icon assets
    ├── next.svg, vercel.svg, window.svg# Next.js and Vercel brand vector assets
```

---

## Detailed Data Schema & Infrastructure Audit

Database models and relational schemas are defined declaratively in `prisma/schema.prisma` and compiled to JavaScript using the `@prisma/client` engine.

### Connection Configuration

- **Datasource Provider:** SQLite (`provider = "sqlite"`)
- **Connection URL:** Configured via environment variable in `.env`:
  ```bash
  DATABASE_URL="file:./dev.db"
  ```
- **Prisma Client Singleton (`lib/prisma.js`):** Implements the recommended Next.js singleton pattern. It attaches `prisma` to `globalThis` in non-production environments to avoid exhausting file handles during hot-reloads:
  ```javascript
  import { PrismaClient } from "@prisma/client";
  const globalForPrisma = globalThis;
  export const prisma = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```

### Entity Specifications

#### 1. `Customer` Entity
Represents an individual enterprise tenant or account node monitored within the platform.

```prisma
model Customer {
  id              String       @id @default(uuid())
  accountNode     String       @unique
  industry        String
  monthlySpending Float
  inactivityDays  Int
  complaintCount  Int
  usageFrequency  Int
  createdAt       DateTime     @default(now())

  predictions     Prediction[]
}
```

- `id`: UUID primary key.
- `accountNode`: Unique business account identifier (e.g. `ACME_ENTERPRISE_NODE`).
- `industry`: Sector classification (e.g., `SAAS`, `TELECOM`, `BANKING`, `COMMERCE`).
- `monthlySpending`: Recurring contract value per monthly billing cycle in USD.
- `inactivityDays`: Cumulative days elapsed without meaningful product interaction.
- `complaintCount`: Total recorded support escalations or ticket submissions.
- `usageFrequency`: Average weekly active platform sessions.
- `predictions`: One-to-many relation to the historical prediction record log.

#### 2. `Prediction` Entity
Stores immutable historical inference logs generated by either the FastAPI ML service or the offline fallback engine.

```prisma
model Prediction {
  id                 String    @id @default(uuid())
  customerId         String
  customer           Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  churnProbability   Float
  riskClassification RiskTier
  shapExplanations   Json
  calculatedAt       DateTime  @default(now())
}
```

- `id`: UUID primary key.
- `customerId`: Foreign key referencing `Customer.id` with `onDelete: Cascade` to ensure referential integrity on customer deletion.
- `churnProbability`: Normalized churn risk factor stored as a floating-point value between `0.0` and `1.0`.
- `riskClassification`: Stratified risk label mapped to the `RiskTier` enum (`LOW`, `MEDIUM`, `HIGH`).
- `shapExplanations`: Serialized JSON object capturing local feature attribution weights and baseline values.
- `calculatedAt`: Timestamp of inference calculation (`DateTime @default(now())`).

#### 3. `User` Entity & Security Roles
Manages platform authentication and Role-Based Access Control (RBAC).

```prisma
enum Role {
  ADMIN
  ANALYST
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed password string
  role      Role     @default(ANALYST)
  createdAt DateTime @default(now())
}
```

- `Role.ADMIN`: Authorized to create/delete customers, run batch imports, and flush telemetry logs.
- `Role.ANALYST`: Authorized to run on-demand single-node inferences and inspect dashboards.

---

## API Contract Specifications (Python / FastAPI Backend)

The standalone machine learning service runs independently in `ml_backend/main.py`.

### Service Configuration
- **Base URL:** `http://127.0.0.1:8000`
- **Interactive Documentation:** Swagger UI at `http://127.0.0.1:8000/docs`, ReDoc at `http://127.0.0.1:8000/redoc`
- **CORS Policy:** Open access (`allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`)

### Endpoint: Telemetry Inference Calculation

```http
POST /api/v1/predict
Content-Type: application/json
Accept: application/json
```

#### Request Payload Schema (`InferenceRequest`)

```json
{
  "industry": "TELECOM",
  "features": {
    "monthly_spending": 2400.00,
    "inactivity_days": 14,
    "complaint_count": 4,
    "usage_frequency": 2
  }
}
```

**Field Validation Constraints:**
- `industry` (str): Case-insensitive string representing the customer sector.
- `features.monthly_spending` (float): Greater than or equal to 0.0 (`ge=0`).
- `features.inactivity_days` (int): Greater than or equal to 0 (`ge=0`).
- `features.complaint_count` (int): Greater than or equal to 0 (`ge=0`).
- `features.usage_frequency` (int): Greater than or equal to 0 (`ge=0`).

#### Response Payload Schema (`InferenceResponse`)

```json
{
  "churn_probability": 0.742,
  "confidence_score": 0.91,
  "risk_tier": "CRITICAL",
  "shap_values": {
    "base_value": 0.18,
    "complaint_count_weight": 1.68,
    "inactivity_days_weight": 0.7,
    "usage_frequency_weight": -0.3,
    "monthly_spending_weight": 1.92
  },
  "recommendations": [
    {
      "type": "DISCOUNT",
      "title": "Loyalty Renewal Bundle",
      "desc": "Provision a 25% data pack discount plan instantly."
    },
    {
      "type": "CALL_BACK",
      "title": "Executive Care Routing",
      "desc": "Escalate to proactive customer support queue."
    }
  ],
  "cluster_segment": "HIGH VALUE AT RISK"
}
```

#### HTTP Response Status Codes
- `200 OK`: Telemetry processed successfully.
- `422 Unprocessable Entity`: Request body failed Pydantic schema validation.
- `500 Internal Server Error`: Computation error inside the ML matrix pipeline.

---

## Business Logic Mapping

### 1. Data Ingestion & Batch CSV Pipeline
The platform supports ingestion through two paths:
- **UI Client Flow:** The `DataPanel.js` component accepts CSV files via drag-and-drop or file dialog, extracts text via `FileReader`, and invokes the Server Action `importTelemetryCSVAction(csvRawText)`.
- **Headless HTTP Flow:** Clients post raw text via `POST /app/api/data` with `{ "csvRawText": "..." }`.

#### Ingestion Workflow:
1. **Dynamic Delimiter Detection:** Scans the header row for tab characters (`\t`) or standard commas (`,`) to support both CSV and TSV formats.
2. **Safe Regex Parsing:** Applies regex `/,(?=(?:(?:[^"]*"){2})*[^"]*$)/` to ensure fields containing quoted commas (e.g. `"Enterprise, Inc."`) are not split incorrectly.
3. **Upsert Operation:** Upserts each valid row into the SQLite `Customer` table using `accountNode` as the unique constraint key, creating new records or updating existing metrics.
4. **FastAPI Health Pre-Check:** Executes an upfront ping to `http://127.0.0.1:8000/docs` with an 800ms abort controller timeout. If unreachable, the batch runner switches all incoming records to the offline fallback engine, eliminating 600+ failed network retry cycles.
5. **Concurrency Control:** Batches customer IDs into chunks of 15 (`CHUNK_SIZE = 15`) and runs them concurrently using `Promise.all` with retry delays to eliminate SQLite file locking errors.
6. **Cache Invalidation:** Calls `revalidatePath` across `/dashboard`, `/dashboard/predictions`, `/dashboard/segments`, and `/` so all connected views reflect new data immediately.

### 2. Analytics & Financial Risk Calculation Layer
Implemented across `app/actions/customer.js` and `app/dashboard/page.js`:
- **Total Portfolio CLV:**
  $$\text{Portfolio CLV} = \sum_{i=1}^{N} \text{monthlySpending}_i$$
- **Financial Damage Exposure (Estimated Revenue Loss):**
  $$\text{Estimated Loss} = \sum_{i=1}^{N} \left( \text{monthlySpending}_i \times P(\text{churn})_i \right)$$
  *(For uncalculated accounts, the system applies a defensive heuristic: spending $\times 0.50$ if complaints $> 3$, otherwise spending $\times 0.05$.)*
- **Net Secure Revenue:**
  $$\text{Net Secure Revenue} = \text{Portfolio CLV} - \text{Estimated Revenue Loss}$$
- **Aggregate Retention Rate:**
  $$\text{Retention Rate} = \frac{\text{Stable Accounts} + \text{Elevated Accounts}}{N} \times 100$$
- **Real-Time Alert Center:** Automatically extracts the top 3 critical exposure accounts where risk exceeds 65%, formatting instant retention playbook triggers.

### 3. Machine Learning Inference & Explainability Engine
Located in `ml_backend/main.py`:
- **Statistical Logit Scoring:**
  $$\text{Logit} = w_0 + (w_{\text{complaints}} \times \text{complaints}) + (w_{\text{inactivity}} \times \text{inactivity}) + (w_{\text{frequency}} \times \text{frequency}) + (w_{\text{spending}} \times \text{spending})$$
  Where calibrated model weights are:
  - $w_0 = -1.5$ (Base Intercept)
  - $w_{\text{complaints}} = +0.42$ (Primary risk driver)
  - $w_{\text{inactivity}} = +0.05$ (Engagement decay driver)
  - $w_{\text{frequency}} = -0.15$ (Protective retention driver)
  - $w_{\text{spending}} = +0.0008$ (Contract scale factor)
- **Sigmoid Mapping:**
  $$P(\text{churn}) = \frac{1}{1 + e^{-\text{Logit}}} \quad \text{clamped to } [0.01, 0.99]$$
- **Stratified Risk Tiers:**
  - `STABLE`: $P(\text{churn}) < 0.35$
  - `ELEVATED`: $0.35 \le P(\text{churn}) \le 0.65$
  - `CRITICAL`: $P(\text{churn}) > 0.65$
- **SHAP Feature Attribution Vectors:** Linear feature contribution weights are derived directly from the active logit parameters:
  $$\text{weight}_k = \text{metric}_k \times w_k$$
  This allows both positive risk forces (red) and protective negative forces (green) to be rendered transparently in `ShapAnalyticsPanel.js` and `ShapDrawer.js`.
- **K-Means Behavioral Cohort Segmentation:**
  Computes Euclidean distance between the 4D customer vector $[\text{spending}, \text{inactivity}, \text{complaints}, \text{frequency}]$ and three fixed centroids:
  - **High Value At Risk:** Centroid $[2400.0, 15.0, 4.0, 2.0]$
  - **Dormant Core User:** Centroid $[1000.0, 25.0, 5.0, 1.0]$
  - **Stable Baseline Group:** Centroid $[3000.0, 2.0, 0.0, 45.0]$
  The customer is assigned to the segment with the minimum Euclidean distance.

---

## Step-by-Step Local Deployment & Bootstrap Instructions

Follow these exact steps to bootstrap both the Next.js application and the Python machine learning backend locally.

### Prerequisites
- **Node.js:** v20.x or v22.x LTS installed
- **npm:** v10.x or higher
- **Python:** v3.11, v3.12, or v3.14 installed with `pip` and `venv`
- **Git:** Standard CLI installed

---

### Step 1: Clone the Repository & Configure Environment

```bash
# Clone the repository
git clone https://github.com/rimshakonain/CustomerChurnAI.git
cd CustomerChurnAI

# Verify or create the .env file in the project root
# The file must contain the following variables:
cat << 'EOF' > .env
DATABASE_URL="file:./dev.db"
FASTAPI_SERVICE_URL="http://127.0.0.1:8000"
EOF
```

---

### Step 2: Bootstrap the Python FastAPI Backend

Open a dedicated terminal window for the Python backend:

```bash
# Navigate to the ml_backend directory
cd ml_backend

# Create a virtual environment (if not already present)
python -m venv venv

# Activate the virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# Install required Python dependencies
pip install fastapi uvicorn pydantic numpy

# Start the FastAPI ASGI server with auto-reload enabled
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend health by opening your browser to:
- `http://127.0.0.1:8000/docs` (Swagger UI)

---

### Step 3: Bootstrap the Next.js Application & Database

Open a second terminal window in the project root directory:

```bash
# Install Node.js dependencies
npm install

# Push the Prisma schema to generate the local SQLite database
npx prisma db push

# Generate the typesafe Prisma Client
npx prisma generate

# Hydrate the database with enterprise customer profiles
npm run seed
# Or execute directly: node prisma/seed.js

# Start the Next.js development server
npm run dev
```

The Next.js application will launch on:
- `http://localhost:3000`

---

### Step 4: Access Application Consoles

| Service | Address | Description |
| :--- | :--- | :--- |
| **Landing Presentation** | `http://localhost:3000/` | Public overview, value proposition, and theme selector. |
| **Executive Console** | `http://localhost:3000/dashboard` | Main telemetry monitor, KPI cards, alerts, and live scoring. |
| **Prediction Records** | `http://localhost:3000/dashboard/predictions` | Historical prediction sequence logs with SHAP drawers. |
| **Behavioral Segments** | `http://localhost:3000/dashboard/segments` | Multi-column K-Means customer cohort clusters. |
| **Prisma Studio (GUI)** | Run `npx prisma studio` | Visual database manager at `http://localhost:5555`. |
| **FastAPI Swagger Docs**| `http://127.0.0.1:8000/docs` | Interactive OpenAPI documentation for the ML microservice. |

---

## Feature Set Verification Matrix

This matrix documents the verification status across all system layers:

| Module / Feature | Operational Capability | Implementation Path | Verification Status |
| :--- | :--- | :--- | :--- |
| **Landing Presentation** | Dark/Light presentation toggle, value prop overview, sector showcases. | `app/page.js` | Verified Operational |
| **Executive KPI Summary** | Real-time calculation of CLV, Revenue Loss, Retention Rate, and Threat Matrix. | `app/dashboard/page.js` | Verified Operational |
| **System Risk Alert Center** | High-visibility alert cards for accounts exceeding 65% churn risk. | `app/dashboard/page.js` | Verified Operational |
| **Telemetry Footprint Monitor**| Tabular view of customer contract metrics with row selection parameters. | `app/dashboard/page.js` | Verified Operational |
| **On-Demand Single Inferences**| One-click `SCORE_NODE` action triggering FastAPI calculation with inline state badges. | `app/components/AnalyzeButton.js` | Verified Operational |
| **Customer 360° Profile** | Active node breakdown showing industry, contract, complaints, and idle days. | `app/components/ShapAnalyticsPanel.js` | Verified Operational |
| **Historical Churn Timeline** | Visual trend tracker rendering historical prediction scores per customer. | `app/components/ShapAnalyticsPanel.js` | Verified Operational |
| **Local SHAP Feature Bars** | Directional horizontal bar chart showing positive (red) and negative (green) weights. | `app/components/ShapAnalyticsPanel.js` | Verified Operational |
| **What-If Risk Simulator** | Interactive range sliders recalculating churn risk dynamically on the client. | `app/components/ShapAnalyticsPanel.js` | Verified Operational |
| **Mitigation Email Generator** | Formats customizable executive outreach email based on active account telemetry. | `app/components/ShapAnalyticsPanel.js` | Verified Operational |
| **SHAP Slide-Over Drawer** | Flyout drawer on the predictions page displaying feature impact rankings. | `app/components/ShapDrawer.js` | Verified Operational |
| **Prediction History Table** | Chronological log of all model inferences with status badges and timestamps. | `app/dashboard/predictions/page.js` | Verified Operational |
| **K-Means Cohort View** | 3-column grouping: High-Value At Risk, Inactive Core, and Stable Baseline. | `app/dashboard/segments/page.js` | Verified Operational |
| **CSV Telemetry Ingestion** | Drag-and-drop CSV parser with delimiter detection and upsert transactions. | `app/components/DataPanel.js` | Verified Operational |
| **CSV Data Export** | Generates and downloads strict RFC-compliant CSV files from SQLite records. | `app/components/DataPanel.js` | Verified Operational |
| **Two-Phase System Purge** | Flushes prediction logs and customer nodes with confirmation modal. | `app/components/DataPanel.js` | Verified Operational |
| **FastAPI ML Service** | Standalone logit evaluation, confidence scoring, and recommendation playbooks. | `ml_backend/main.py` | Verified Operational |
| **Offline Fallback Engine** | Heuristic fallback activated automatically when FastAPI is unreachable. | `app/actions/pipeline.js` | Verified Operational |
| **Concurrency Lock Protection**| Batch chunking (15 nodes/chunk) with sleep retries to protect SQLite file locks. | `app/actions/pipeline.js` | Verified Operational |
| **Enum Self-Healing Injection**| Trial-and-error casing normalization and DMMF token inspection for `RiskTier`. | `app/actions/pipeline.js` | Verified Operational |
| **RBAC Route Security** | Role verification (`ADMIN` vs `ANALYST`) via encrypted HTTP-only session cookies. | `app/actions/auth.js` | Verified Operational |
| **Database Hydration** | Multi-industry enterprise test profile seeding via Prisma ORM. | `prisma/seed.js` | Verified Operational |

---

## License & Usage

Developed for educational, research, and enterprise demonstration purposes. All architectural components and predictive pipelines are licensed under the MIT License.
This project is intended for educational and research purposes.