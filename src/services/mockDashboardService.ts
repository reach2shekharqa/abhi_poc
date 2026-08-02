import type {
  BenchmarkResponse,
  DashboardSnapshot,
  EntityRecord,
  FinancialRecord,
  GstRecord,
  InsightResult,
  StockRecord,
  UploadedDocument,
  UserAccount,
} from "../types";

const users: UserAccount[] = [
  {
    userId: "USER001",
    password: "Demo@123",
    userName: "abhi.admin",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    email: "abhi@example.com",
    contactNumber: "9876543210",
  },
];

const entities: EntityRecord[] = [
  {
    id: "entity-1",
    userId: "USER001",
    name: "Alpha Foods Pvt Ltd",
    sector: "Agriculture",
    subSector: "Farming",
    constitution: "Private Limited",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    email: "alpha@example.com",
    contactNumber: "9123456780",
  },
  {
    id: "entity-2",
    userId: "USER001",
    name: "Delta Tech Services",
    sector: "Services",
    subSector: "Information Technology",
    constitution: "Private Limited",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    email: "delta@example.com",
    contactNumber: "9001234567",
  },
  {
    id: "entity-3",
    userId: "USER001",
    name: "Gamma Metals Works",
    sector: "Manufacturing",
    subSector: "Metals and Machinery",
    constitution: "Partnership",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    email: "gamma@example.com",
    contactNumber: "9090909090",
  },
];

const financialRecords: FinancialRecord[] = [
  {
    userId: "USER001",
    nameOfEntity: "Alpha Foods Pvt Ltd",
    subsector: "Farming",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    revenue: 4500000,
    operatingProfit: 880000,
    netProfit: 620000,
    financeCost: 160000,
    debtor: 470000,
    creditors: 330000,
    borrowing: 510000,
    cashAndBalance: 680000,
    fixedAssets: 980000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Alpha Foods Pvt Ltd",
    subsector: "Farming",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    revenue: 5100000,
    operatingProfit: 960000,
    netProfit: 680000,
    financeCost: 170000,
    debtor: 520000,
    creditors: 360000,
    borrowing: 540000,
    cashAndBalance: 720000,
    fixedAssets: 1010000,
    frequency: "Monthly",
    month: "Feb",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Delta Tech Services",
    subsector: "Information Technology",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    revenue: 9100000,
    operatingProfit: 2400000,
    netProfit: 1550000,
    financeCost: 260000,
    debtor: 1300000,
    creditors: 720000,
    borrowing: 900000,
    cashAndBalance: 1500000,
    fixedAssets: 2100000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Delta Tech Services",
    subsector: "Information Technology",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    revenue: 9600000,
    operatingProfit: 2650000,
    netProfit: 1710000,
    financeCost: 280000,
    debtor: 1380000,
    creditors: 760000,
    borrowing: 930000,
    cashAndBalance: 1580000,
    fixedAssets: 2140000,
    frequency: "Monthly",
    month: "Feb",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Gamma Metals Works",
    subsector: "Metals and Machinery",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    revenue: 7600000,
    operatingProfit: 1400000,
    netProfit: 870000,
    financeCost: 230000,
    debtor: 990000,
    creditors: 650000,
    borrowing: 820000,
    cashAndBalance: 860000,
    fixedAssets: 1800000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Gamma Metals Works",
    subsector: "Metals and Machinery",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    revenue: 8200000,
    operatingProfit: 1520000,
    netProfit: 930000,
    financeCost: 240000,
    debtor: 1030000,
    creditors: 670000,
    borrowing: 860000,
    cashAndBalance: 900000,
    fixedAssets: 1850000,
    frequency: "Monthly",
    month: "Feb",
    year: 2025,
  },
];

const stockRecords: StockRecord[] = [
  {
    userId: "USER001",
    nameOfEntity: "Alpha Foods Pvt Ltd",
    subsector: "Farming",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    rawMaterial: 410000,
    workInProgress: 320000,
    finishedGoods: 510000,
    debtors: 470000,
    creditors: 330000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Delta Tech Services",
    subsector: "Information Technology",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    rawMaterial: 840000,
    workInProgress: 650000,
    finishedGoods: 980000,
    debtors: 1380000,
    creditors: 760000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Gamma Metals Works",
    subsector: "Metals and Machinery",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    rawMaterial: 950000,
    workInProgress: 760000,
    finishedGoods: 840000,
    debtors: 1030000,
    creditors: 670000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
];

const gstRecords: GstRecord[] = [
  {
    userId: "USER001",
    nameOfEntity: "Alpha Foods Pvt Ltd",
    subsector: "Farming",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    sales: 4500000,
    returnAmount: 210000,
    gstPaid: 320000,
    gstInputCredit: 290000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Delta Tech Services",
    subsector: "Information Technology",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    sales: 9100000,
    returnAmount: 410000,
    gstPaid: 520000,
    gstInputCredit: 440000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
  {
    userId: "USER001",
    nameOfEntity: "Gamma Metals Works",
    subsector: "Metals and Machinery",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    sales: 7600000,
    returnAmount: 300000,
    gstPaid: 430000,
    gstInputCredit: 380000,
    frequency: "Monthly",
    month: "Jan",
    year: 2025,
  },
];

const uploadedDocuments: UploadedDocument[] = [];

function getEntityByName(name: string) {
  return entities.find((entity) => entity.name === name);
}

function buildFinancialRecord(document: UploadedDocument): FinancialRecord | null {
  const matchedEntity = getEntityByName(document.entityName);

  if (!matchedEntity) {
    return null;
  }

  const previous = financialRecords
    .filter((record) => record.nameOfEntity === matchedEntity.name && record.year === document.year)
    .sort((first, second) => second.revenue - first.revenue)[0];

  const baseRevenue = previous?.revenue ?? 4000000;
  const revenue = baseRevenue + 250000;

  return {
    userId: document.userId,
    nameOfEntity: matchedEntity.name,
    subsector: matchedEntity.subSector,
    city: matchedEntity.city,
    state: matchedEntity.state,
    country: matchedEntity.country,
    revenue,
    operatingProfit: Math.round(revenue * 0.2),
    netProfit: Math.round(revenue * 0.12),
    financeCost: Math.round(revenue * 0.03),
    debtor: Math.round(revenue * 0.11),
    creditors: Math.round(revenue * 0.08),
    borrowing: Math.round(revenue * 0.10),
    cashAndBalance: Math.round(revenue * 0.15),
    fixedAssets: Math.round(revenue * 0.20),
    frequency: "Monthly",
    month: document.month,
    year: document.year,
  };
}

function buildStockRecord(document: UploadedDocument): StockRecord | null {
  const matchedEntity = getEntityByName(document.entityName);

  if (!matchedEntity) {
    return null;
  }

  const previous = stockRecords
    .filter((record) => record.nameOfEntity === matchedEntity.name && record.year === document.year)
    .sort((first, second) => second.finishedGoods - first.finishedGoods)[0];

  const baseAmount = previous?.finishedGoods ?? 500000;

  return {
    userId: document.userId,
    nameOfEntity: matchedEntity.name,
    subsector: matchedEntity.subSector,
    city: matchedEntity.city,
    state: matchedEntity.state,
    country: matchedEntity.country,
    rawMaterial: baseAmount + 40000,
    workInProgress: baseAmount + 30000,
    finishedGoods: baseAmount + 50000,
    debtors: baseAmount + 50000,
    creditors: baseAmount + 25000,
    frequency: "Monthly",
    month: document.month,
    year: document.year,
  };
}

function buildGstRecord(document: UploadedDocument): GstRecord | null {
  const matchedEntity = getEntityByName(document.entityName);

  if (!matchedEntity) {
    return null;
  }

  const previous = gstRecords
    .filter((record) => record.nameOfEntity === matchedEntity.name && record.year === document.year)
    .sort((first, second) => second.sales - first.sales)[0];

  const sales = (previous?.sales ?? 4000000) + 200000;

  return {
    userId: document.userId,
    nameOfEntity: matchedEntity.name,
    subsector: matchedEntity.subSector,
    city: matchedEntity.city,
    state: matchedEntity.state,
    country: matchedEntity.country,
    sales,
    returnAmount: Math.round(sales * 0.04),
    gstPaid: Math.round(sales * 0.06),
    gstInputCredit: Math.round(sales * 0.05),
    frequency: "Monthly",
    month: document.month,
    year: document.year,
  };
}

function getMonthlySalesTrend(records: FinancialRecord[]) {
  return records.map((record) => ({
    period: record.month,
    sales: record.revenue,
  }));
}

function getConsolidatedRecords(records: FinancialRecord[]) {
  const totals = records.reduce(
    (acc, current) => {
      acc.revenue += current.revenue;
      acc.operatingProfit += current.operatingProfit;
      acc.netProfit += current.netProfit;
      acc.financeCost += current.financeCost;
      acc.debtor += current.debtor;
      acc.creditors += current.creditors;
      acc.borrowing += current.borrowing;
      acc.cashAndBalance += current.cashAndBalance;
      acc.fixedAssets += current.fixedAssets;
      return acc;
    },
    {
      revenue: 0,
      operatingProfit: 0,
      netProfit: 0,
      financeCost: 0,
      debtor: 0,
      creditors: 0,
      borrowing: 0,
      cashAndBalance: 0,
      fixedAssets: 0,
    },
  );

  return totals;
}

export const mockDashboardService = {
  login(userId: string, password: string) {
    const match = users.find(
      (user) => user.userId === userId && user.password === password,
    );

    if (!match) {
      return null;
    }

    return match;
  },

  createAccount(payload: UserAccount) {
    users.push(payload);
    return payload;
  },

  recoverPassword(userId: string, email: string) {
    const match = users.find(
      (user) => user.userId === userId && user.email === email,
    );

    return match ? "Demo@123" : null;
  },

  getEntities(userId: string) {
    return entities.filter((entity) => entity.userId === userId);
  },

  saveEntity(entity: EntityRecord) {
    const index = entities.findIndex((item) => item.id === entity.id);

    if (index >= 0) {
      entities[index] = entity;
    } else {
      entities.push(entity);
    }

    return entity;
  },

  uploadDocument(document: UploadedDocument) {
    uploadedDocuments.push(document);

    if (document.type === "financial") {
      const financialRecord = buildFinancialRecord(document);
      if (financialRecord) {
        financialRecords.push(financialRecord);
      }
    }

    if (document.type === "stock") {
      const stockRecord = buildStockRecord(document);
      if (stockRecord) {
        stockRecords.push(stockRecord);
      }
    }

    if (document.type === "gst") {
      const gstRecord = buildGstRecord(document);
      if (gstRecord) {
        gstRecords.push(gstRecord);
      }
    }

    return document;
  },

  getDashboardData(userId: string, entityId: string, year: number): DashboardSnapshot {
    const targetEntityIds = entityId === "consolidated"
      ? entities.filter((entity) => entity.userId === userId).map((entity) => entity.id)
      : [entityId];

    const records = financialRecords.filter(
      (record) =>
        record.userId === userId &&
        record.year === year &&
        targetEntityIds.includes(
          entities.find((entity) => entity.name === record.nameOfEntity)?.id ?? "",
        ),
    );

    const stockRecord = stockRecords.find(
      (record) =>
        record.userId === userId &&
        record.year === year &&
        targetEntityIds.includes(
          entities.find((entity) => entity.name === record.nameOfEntity)?.id ?? "",
        ),
    );

    const consolidated = getConsolidatedRecords(records);

    const assetBreakdown = [
      { name: "Fixed Assets", value: consolidated.fixedAssets },
      { name: "Cash and Balance", value: consolidated.cashAndBalance },
      { name: "Debtors", value: consolidated.debtor },
    ];

    const liabilityBreakdown = [
      { name: "Borrowings", value: consolidated.borrowing },
      { name: "Creditors", value: consolidated.creditors },
    ];

    const costBreakdown = [
      { category: "Finance Cost", amount: consolidated.financeCost },
      { category: "Operating Profit", amount: consolidated.operatingProfit },
      { category: "Net Profit", amount: consolidated.netProfit },
    ];

    return {
      salesTrend: getMonthlySalesTrend(records),
      inventorySnapshot: stockRecord
        ? {
            rawMaterial: stockRecord.rawMaterial,
            workInProgress: stockRecord.workInProgress,
            finishedGoods: stockRecord.finishedGoods,
          }
        : {
            rawMaterial: 0,
            workInProgress: 0,
            finishedGoods: 0,
          },
      assetBreakdown,
      liabilityBreakdown,
      costBreakdown,
    };
  },

  getIndustryInsight(entityId: string, period: string): InsightResult {
    const entity = entities.find((item) => item.id === entityId);

    if (!entity) {
      return {
        summary: "No entity selected.",
        sources: [],
      };
    }

    const summary = `Based on the selected ${entity.sector} / ${entity.subSector} context for the ${period} horizon, the entity is expected to benefit from stable demand trends, disciplined cost controls, and better operational visibility. The short-term outlook remains positive with incremental improvements in revenue quality, inventory planning, and working capital efficiency. Sector participants should monitor input cost changes, downstream demand patterns, and policy triggers that can alter margin performance. In this period, management focus should remain on revenue resilience, asset utilization, and cash conversion to sustain competitive positioning.`;

    return {
      summary,
      sources: [
        {
          title: `${entity.subSector} outlook report`,
          url: `https://example.com/${entity.subSector.toLowerCase().replace(/\s+/g, "-")}/report`,
        },
        {
          title: `${entity.sector} sector briefing`,
          url: `https://example.com/${entity.sector.toLowerCase()}/briefing`,
        },
      ],
    };
  },

  getBenchmarkData(entityId: string, parameter: string, period: string, geography: string): BenchmarkResponse {
    const entity = entities.find((item) => item.id === entityId);
    const currentEntityName = entity?.name ?? "Selected Entity";
    const benchmarkEntities = entities.map((item, index) => ({
      name: item.name,
      rank: index + 1,
      revenue: 3000000 + index * 1500000,
      operatingProfitMargin: 14 + index * 1.5,
      netProfitMargin: 8 + index * 1.2,
    }));

    void parameter;
    void period;
    void geography;

    const selected = benchmarkEntities.find((item) => item.name === currentEntityName) ?? benchmarkEntities[0];

    return {
      entries: benchmarkEntities,
      selectedEntityName: currentEntityName,
      comparisonEntities: [
        benchmarkEntities[0],
        benchmarkEntities[Math.max(0, benchmarkEntities.findIndex((item) => item.name === currentEntityName) - 1)],
        selected,
        benchmarkEntities[Math.min(benchmarkEntities.length - 1, benchmarkEntities.findIndex((item) => item.name === currentEntityName) + 1)],
        benchmarkEntities[benchmarkEntities.length - 1],
      ].map((entry, index) => ({
        name: entry.name,
        revenue: entry.revenue,
        operatingProfitMargin: entry.operatingProfitMargin,
        netProfitMargin: entry.netProfitMargin,
        highlight: entry.name === currentEntityName && index === 2,
      })),
    };
  },

  getDocuments(userId: string) {
    return uploadedDocuments.filter((item) => item.userId === userId);
  },

  getGstRecords(userId: string) {
    return gstRecords.filter((item) => item.userId === userId);
  },
};
