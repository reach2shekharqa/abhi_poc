export type Sector =
  | "Agriculture"
  | "Manufacturing"
  | "Services"
  | "Mining";

export type AgricultureSubSector =
  | "Farming"
  | "Horticulture"
  | "Animal Husbandry and Dairy"
  | "Fisheries";

export type ManufacturingSubSector =
  | "Automotive and Aerospace"
  | "Chemicals and Petrochemicals"
  | "Food Processing"
  | "Electronics and High-Tech"
  | "Textiles and Apparel"
  | "Metals and Machinery"
  | "Gems and Jewellery"
  | "Public Infrastructure";

export type ServicesSubSector =
  | "Financial Services"
  | "Real Estate Services"
  | "Information Technology"
  | "Tourism and Hospitality"
  | "Healthcare Services"
  | "Retail Trade"
  | "Wholesale Trade"
  | "Professional Services";

export type Constitution =
  | "HUF"
  | "Proprietorship"
  | "Partnership"
  | "LLP"
  | "Private Limited"
  | "Unlisted Public Limited"
  | "Listed Public Limited";

export interface UserAccount {
  userId: string;
  password: string;
  userName: string;
  city: string;
  state: string;
  country: string;
  email: string;
  contactNumber?: string;
}

export interface EntityRecord {
  id: string;
  userId: string;
  name: string;
  sector: Sector;
  subSector: string;
  constitution: Constitution;
  city: string;
  state: string;
  country: string;
  email: string;
  contactNumber?: string;
}

export interface UploadedDocument {
  id: string;
  userId: string;
  entityName: string;
  type: "financial" | "stock" | "gst";
  fileName: string;
  fileFormat: string;
  month: string;
  year: number;
  timestamp: string;
}

export interface FinancialRecord {
  userId: string;
  nameOfEntity: string;
  subsector: string;
  city: string;
  state: string;
  country: string;
  revenue: number;
  operatingProfit: number;
  netProfit: number;
  financeCost: number;
  debtor: number;
  creditors: number;
  borrowing: number;
  cashAndBalance: number;
  fixedAssets: number;
  frequency: "Monthly" | "Quarterly" | "Half Yearly" | "Annual";
  month: string;
  year: number;
}

export interface StockRecord {
  userId: string;
  nameOfEntity: string;
  subsector: string;
  city: string;
  state: string;
  country: string;
  rawMaterial: number;
  workInProgress: number;
  finishedGoods: number;
  debtors: number;
  creditors: number;
  frequency: "Monthly" | "Quarterly" | "Half Yearly" | "Annual";
  month: string;
  year: number;
}

export interface GstRecord {
  userId: string;
  nameOfEntity: string;
  subsector: string;
  city: string;
  state: string;
  country: string;
  sales: number;
  returnAmount: number;
  gstPaid: number;
  gstInputCredit: number;
  frequency: "Monthly" | "Quarterly" | "Half Yearly" | "Annual";
  month: string;
  year: number;
}

export interface DashboardSnapshot {
  salesTrend: Array<{ period: string; sales: number }>;
  inventorySnapshot: { rawMaterial: number; workInProgress: number; finishedGoods: number };
  assetBreakdown: Array<{ name: string; value: number }>;
  liabilityBreakdown: Array<{ name: string; value: number }>;
  costBreakdown: Array<{ category: string; amount: number }>;
}

export interface InsightResult {
  summary: string;
  sources: Array<{ title: string; url: string }>;
}

export interface BenchmarkEntry {
  name: string;
  rank: number;
  revenue: number;
  operatingProfitMargin: number;
  netProfitMargin: number;
}

export interface BenchmarkResponse {
  entries: BenchmarkEntry[];
  selectedEntityName: string;
  comparisonEntities: Array<{
    name: string;
    revenue: number;
    operatingProfitMargin: number;
    netProfitMargin: number;
    highlight?: boolean;
  }>;
}

export interface ExtractionMetrics {
  revenue: number;
  fixedAssets: number;
  cashAndBalance: number;
  debtors: number;
  creditors: number;
  borrowings: number;
  operatingProfit: number;
  netProfit: number;
  financeCost: number;
  rawMaterial: number;
  workInProgress: number;
  finishedGoods: number;
}
