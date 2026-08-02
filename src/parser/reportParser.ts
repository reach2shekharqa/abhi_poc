
export interface ReportData {
  category: string;
  amount: number;
}


/*
 * ============================================================
 * DASHBOARD METRIC DEFINITIONS
 * ============================================================
 *
 * These names MUST match the backend API exactly.
 *
 * Backend:
 *
 * revenue
 * fixedAssets
 * cashAndBalance
 * debtors
 * creditors
 * borrowings
 * operatingProfit
 * netProfit
 * financeCost
 * rawMaterial
 * workInProgress
 * finishedGoods
 *
 * This parser does NOT calculate anything.
 * It only maps API metrics into ReportData.
 * ============================================================
 */

const FINANCIAL_METRICS: Record<
  string,
  string
> = {

  revenue:
    "Revenue",

  fixedAssets:
    "Fixed Assets",

  cashAndBalance:
    "Cash & Bank Balance",

  debtors:
    "Debtors",

  creditors:
    "Creditors",

  borrowings:
    "Borrowings",

  operatingProfit:
    "Operating Profit",

  netProfit:
    "Net Profit",

  financeCost:
    "Finance Cost",
};


const STOCK_METRICS: Record<
  string,
  string
> = {

  rawMaterial:
    "Raw Material",

  workInProgress:
    "Work in Progress",

  finishedGoods:
    "Finished Goods",
};


/*
 * ============================================================
 * PARSE REPORT
 * ============================================================
 *
 * IMPORTANT:
 *
 * This function is intended for already-structured metric
 * data.
 *
 * It should NOT attempt to rediscover financial values from
 * arbitrary text.
 *
 * The backend has already performed:
 *
 * PDF
 * ↓
 * extraction
 * ↓
 * FAISS
 * ↓
 * Groq
 * ↓
 * normalized metrics
 *
 * Therefore this layer simply converts those metrics into
 * ReportData[].
 * ============================================================
 */

export function parseReport(
  metrics: Record<string, unknown>,
  documentType:
    | "financial"
    | "stock"
    | "gst" = "financial",
): ReportData[] {

  if (
    !metrics ||
    typeof metrics !== "object"
  ) {

    return [];

  }


  const definitions =
    documentType === "stock"
      ? STOCK_METRICS
      : documentType === "financial"
        ? FINANCIAL_METRICS
        : {};


  return Object.entries(
    definitions,
  )
    .map(
      ([
        key,
        category,
      ]) => {

        const rawValue =
          metrics[key];


        /*
         * ------------------------------------------------------
         * Convert only valid numeric values.
         * ------------------------------------------------------
         */

        const amount =
          typeof rawValue === "number"
            ? rawValue
            : Number(
                rawValue,
              );


        return {
          category,
          amount:
            Number.isFinite(
              amount,
            )
              ? amount
              : 0,
        };

      },
    );
}

