
/*
 * ============================================================
 * METRIC QUERIES
 * ============================================================
 *
 * These queries are used ONLY by the local embedding + FAISS
 * retrieval layer.
 *
 * Their purpose is to retrieve the PDF chunks that contain
 * the actual financial values needed by the dashboard.
 *
 * They are NOT extraction instructions.
 * They should therefore strongly identify:
 *
 *   1. The financial statement / note
 *   2. The exact metric
 *   3. The financial-year columns
 *   4. The numeric value
 *
 * Do not calculate or infer values here.
 * ============================================================
 */


/*
 * ============================================================
 * FINANCIAL DOCUMENT QUERIES
 * ============================================================
 */

const financialMetricQueries = {

    revenue: `
  Revenue from Operations Total Income Sale of Products Note 20
  Revenue
  Sales
  Net Sales
  Turnover
  Income from Operations
  Statement of Profit and Loss
  Income Statement
  Note 20
  Financial Highlights
  Financial-year table
  `,

    fixedAssets: `
  Property Plant and Equipment
  Property, Plant & Equipment
  PPE
  Tangible Assets
  Net Fixed Assets
  Gross Block
  Net Block
  Asset schedule
  Balance Sheet
  Notes to Accounts
  Financial Highlights
  `,

    cashAndBalance: `
  Cash and cash equivalents
  Cash & Cash Equivalents
  Cash and Bank Balances
  Bank Balances
  Balances with Banks
  Balance Sheet
  Cash Balance
  Financial Highlights
  `,

    debtors: `
  Trade Receivables
  Trade Debtors
  Debtors
  Accounts Receivable
  Sundry Debtors
  Receivables
  Balance Sheet
  Notes to Accounts
  Note 16
  Current Assets
  Considered good
  Undisputed
  Financial Highlights
  `,

    creditors: `
  Trade Payables
  Trade Creditors
  Creditors
  Accounts Payable
  Sundry Creditors
  Payables
  Balance Sheet
  Notes to Accounts
  Current Liabilities
  Financial Highlights
  `,

    borrowings: `
  Borrowings
  Loans and Borrowings
  Bank Borrowings
  Secured Loans
  Unsecured Loans
  Term Loans
  Working Capital Loans
  Short-term Borrowings
  Long-term Borrowings
  Debt
  Financial Liabilities
  Cash Credit Limits
  Financial Highlights
  `,

    operatingProfit: `
  Profit Before Tax Profit from Operations Total Expenses Operating Profit EBIT
  Profit from Operations
  Operating Profit
  Statement of Profit and Loss
  Financial-year table
  `,

    netProfit: `
  Net Profit Profit After Tax PAT Profit for the Year Note 8
  Profit attributable to owners
  Statement of Profit and Loss
  Income Statement
  Note 8
  Financial-year table
  `,

    financeCost: `
  Finance Costs Interest Expense Borrowing Costs Note 26
  Finance Cost
  Interest Expense
  Interest Cost
  Borrowing Costs
  Finance Charges
  Interest on Borrowings
  Statement of Profit and Loss
  Notes to Accounts
  Note 26
  Financial Highlights
  `,

  };

/*
 * ============================================================
 * STOCK DOCUMENT QUERIES
 * ============================================================
 */

const stockMetricQueries = {

  rawMaterial: `
Raw Material
Raw Materials
Raw Material Inventory
Raw Material Stock
Balance Sheet
Inventories note
Inventory schedule
Financial Highlights
`,



  workInProgress: `
Work in Progress
Work-in-Progress
WIP
Semi Finished Goods
Semi-Finished Goods
Work in Process
Balance Sheet
Inventories note
Inventory schedule
Financial Highlights
`,



  finishedGoods: `
Finished Goods
Finished Products
Finished Goods Inventory
Finished Stock
Balance Sheet
Inventories note
Inventory schedule
Financial Highlights
`,


};


/*
 * ============================================================
 * GST DOCUMENT QUERIES
 * ============================================================
 */

const gstMetricQueries = {};


/*
 * ============================================================
 * GET METRIC QUERIES
 * ============================================================
 */

export function getMetricQueries(documentType) {

  if (documentType === "stock") {
    return stockMetricQueries;
  }

  if (documentType === "gst") {
    return gstMetricQueries;
  }

  return financialMetricQueries;
}

