const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Purging old records from the database cluster...");
  await prisma.prediction.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log("Provisioning benchmark corporate enterprise tenants...");
  const airtelTenant = await prisma.tenant.create({
    data: {
      name: "Airtel Enterprise"
    }
  });

  const alphaTenant = await prisma.tenant.create({
    data: {
      name: "Alpha Fintech"
    }
  });

  console.log("Injecting fresh enterprise customer profiles under respective tenants...");
  await prisma.customer.createMany({
    data: [
      {
        tenantId: airtelTenant.id,
        accountNode: "ACME_ENTERPRISE_NODE",
        industry: "SAAS",
        monthlySpending: 2400.00,
        inactivityDays: 14,
        complaintCount: 4,
        usageFrequency: 2
      },
      {
        tenantId: airtelTenant.id,
        accountNode: "GLOBEX_TELCO_NODE",
        industry: "TELECOM",
        monthlySpending: 1150.00,
        inactivityDays: 25,
        complaintCount: 6,
        usageFrequency: 1
      },
      {
        tenantId: alphaTenant.id,
        accountNode: "APEX_ALPHA_FINANCIAL",
        industry: "BANKING",
        monthlySpending: 5900.00,
        inactivityDays: 2,
        complaintCount: 0,
        usageFrequency: 45
      },
      {
        tenantId: alphaTenant.id,
        accountNode: "VIRTUAL_MARKET_CORP",
        industry: "COMMERCE",
        monthlySpending: 850.00,
        inactivityDays: 18,
        complaintCount: 3,
        usageFrequency: 5
      }
    ]
  });

  console.log("Seeding benchmark users for tenant isolation testing...");
  await prisma.user.createMany({
    data: [
      {
        tenantId: airtelTenant.id,
        email: "admin@airtel-enterprise.com",
        password: "admin_secure_password",
        role: "ADMIN"
      },
      {
        tenantId: alphaTenant.id,
        email: "analyst@alpha-fintech.com",
        password: "analyst_secure_password",
        role: "ANALYST"
      }
    ]
  });

  console.log("Multi-tenant data layer hydration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
