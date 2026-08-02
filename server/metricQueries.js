
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
Find the financial statement row containing the latest
financial-year revenue / sales value.

PRIORITY:
- Statement of Profit and Loss
- Income Statement
- Revenue section
- Financial-year table with numeric values

Look specifically for:
- Revenue from Operations
- Revenue
- Sales
- Net Sales
- Turnover
- Sales Turnover
- Income from Operations

Also retrieve the table heading and financial-year column labels
surrounding the value.

Do NOT prioritize:
- Revenue growth percentages
- Revenue commentary
- Management discussion
- Directors' Report narrative
- Segment commentary

Return the PDF chunk containing the actual financial statement
row and its numeric financial-year values.
`,

  fixedAssets: `
Find the Balance Sheet or Notes to Accounts row containing
the latest financial-year fixed-asset value.

PRIORITY:
- Balance Sheet
- Property, Plant and Equipment note
- Fixed Assets note
- Asset schedule
- Financial-year table with numeric values

Look specifically for:
- Fixed Assets
- Property Plant and Equipment
- Property, Plant and Equipment
- PPE
- Tangible Assets
- Net Fixed Assets

Also retrieve the table heading and financial-year column labels.

Prefer NET fixed-asset values when both gross and accumulated
depreciation values are present.

Do NOT prioritize:
- Asset commentary
- Capital expenditure discussion
- Depreciation narrative
- Future investment plans

Return the PDF chunk containing the actual asset table.
`,

  cashAndBalance: `
Find the Balance Sheet or Notes to Accounts row containing
the latest financial-year cash / bank balance.

PRIORITY:
- Balance Sheet
- Cash and cash equivalents note
- Cash and bank balance note
- Financial-year table with numeric values

Look specifically for:
- Cash and Cash Equivalents
- Cash & Cash Equivalents
- Cash and Bank Balances
- Cash and Bank
- Bank Balances
- Bank Balance
- Cash Balance
- Cash and Cash Equivalent

Also retrieve the financial-year column labels.

Do NOT prioritize:
- Cash-flow commentary
- Operating cash flow discussion
- Cash generation narrative
- Future liquidity commentary

Return the PDF chunk containing the actual balance-sheet
cash / bank value.
`,

  debtors: `
Find the Balance Sheet or Notes to Accounts row containing
the latest financial-year TRADE RECEIVABLES value.

PRIORITY:
- Balance Sheet
- Trade receivables note
- Current assets section
- Receivables schedule
- Financial-year table with numeric values

Look specifically for:
- Trade Receivables
- Trade Debtors
- Debtors
- Accounts Receivable
- Sundry Debtors
- Receivables

IMPORTANT:
Retrieve the actual numeric balance-sheet value.
Do NOT infer debtors from revenue, sales, turnover, percentages,
collection days, or management commentary.

If the receivables note contains:
- Gross receivables
- Allowance / provision
- Net trade receivables

retrieve the values and surrounding table context so the
extraction layer can determine the reported balance correctly.

Also retrieve the financial-year column labels.

Do NOT prioritize:
- Debtor days
- Collection period
- Customer commentary
- Credit policy discussion
- Receivable ageing commentary unless it contains the
  actual balance
`,

  creditors: `
Find the Balance Sheet or Notes to Accounts row containing
the latest financial-year TRADE PAYABLES value.

PRIORITY:
- Balance Sheet
- Trade payables note
- Current liabilities section
- Payables schedule
- Financial-year table with numeric values

Look specifically for:
- Trade Payables
- Trade Creditors
- Creditors
- Accounts Payable
- Sundry Creditors
- Payables

IMPORTANT:
Retrieve the actual numeric balance-sheet value.
Do NOT infer creditors from expenses, purchases, payable days,
percentages, or management commentary.

Also retrieve the financial-year column labels and table heading.

Do NOT prioritize:
- Payable days
- Supplier commentary
- Payment policy discussion
- Narrative references to creditors
`,

  borrowings: `
Find the Balance Sheet or Notes to Accounts values for the
latest financial-year BORROWINGS / DEBT.

PRIORITY:
- Balance Sheet
- Borrowings note
- Financial liabilities note
- Current liabilities
- Non-current liabilities
- Loans and borrowings schedule

Look specifically for:
- Borrowings
- Loans and Borrowings
- Bank Borrowings
- Secured Loans
- Unsecured Loans
- Term Loans
- Working Capital Loans
- Bank Loans
- Debt
- Financial Liabilities

IMPORTANT:
Retrieve the actual reported numeric borrowing values.

If borrowings are split into:
- Current borrowings
- Non-current borrowings
- Short-term borrowings
- Long-term borrowings

retrieve the relevant rows and surrounding table context so
they can be correctly interpreted later.

Do NOT prioritize:
- Loan repayment commentary
- Interest-rate discussion
- Guarantees
- Contingent liabilities
- Borrowing arrangements
- Management commentary

Also retrieve the financial-year column labels.
`,

  operatingProfit: `
Find the actual operating-profit value from the financial
statement for the latest financial year.

PRIORITY:
- Statement of Profit and Loss
- Income Statement
- Operating results table
- Financial-year table with numeric values

Look specifically for:
- Operating Profit
- Profit from Operations
- Operating Income
- Operating Result
- EBIT, ONLY when it is clearly presented as the company's
  operating profit measure

IMPORTANT:
Retrieve the actual numeric financial-statement value.

Do NOT substitute:
- Gross Profit
- Profit Before Tax
- Profit After Tax
- Net Profit
- Total Income
- Total Expenses
- EBITDA unless the document explicitly identifies it
  as operating profit

Do NOT prioritize:
- Operating margin
- Profitability commentary
- Management discussion
- Growth percentages

Retrieve the financial-year column labels and surrounding
calculation/table context.
`,

  netProfit: `
Find the final net-profit / profit-after-tax value from the
Statement of Profit and Loss for the latest financial year.

PRIORITY:
- Statement of Profit and Loss
- Income Statement
- Profit for the year section
- Final profit/loss row
- Financial-year table with numeric values

Look specifically for:
- Net Profit
- Profit After Tax
- PAT
- Profit for the Year
- Profit / Loss after Tax
- Net Income
- Profit attributable to owners, when this is the final
  reported profit measure relevant to the company

IMPORTANT:
Retrieve the actual numeric value from the financial statement.

Do NOT substitute:
- Profit Before Tax
- Operating Profit
- Gross Profit
- EBITDA
- Total Income

If the statement contains both:
- Profit before tax
- Tax expense
- Profit for the year

retrieve the surrounding rows as well.

Do NOT prioritize narrative profitability discussion.
`,

  financeCost: `
Find the actual finance-cost value from the Statement of
Profit and Loss or relevant financial note for the latest
financial year.

PRIORITY:
- Statement of Profit and Loss
- Finance-cost row
- Interest / borrowing-cost note
- Financial-year table with numeric values

Look specifically for:
- Finance Cost
- Finance Costs
- Interest Expense
- Interest Cost
- Borrowing Costs
- Finance Charges

IMPORTANT:
Retrieve the actual numeric financial-statement value.

Do NOT substitute:
- Total expenses
- Borrowings
- Principal repayment
- Loan balance
- Interest rate
- Finance-cost percentage

Do NOT prioritize narrative discussion about:
- Loans
- Interest rates
- Financing arrangements

Also retrieve the financial-year column labels.
`,
};


/*
 * ============================================================
 * STOCK DOCUMENT QUERIES
 * ============================================================
 */

const stockMetricQueries = {

  rawMaterial: `
Find the latest financial-year INVENTORY value for
Raw Material.

PRIORITY:
- Balance Sheet
- Inventories note
- Inventory schedule
- Financial-year table containing numeric values

Look specifically for:
- Raw Material
- Raw Materials
- Raw Material Inventory
- Raw Material Stock

IMPORTANT:
Retrieve the actual numeric inventory value and the
financial-year column labels.

Do NOT infer raw-material inventory from:
- Purchases
- Cost of materials consumed
- Production quantity
- Inventory turnover
- Management commentary
`,

  workInProgress: `
Find the latest financial-year INVENTORY value for
Work in Progress.

PRIORITY:
- Balance Sheet
- Inventories note
- Inventory schedule
- Financial-year table containing numeric values

Look specifically for:
- Work in Progress
- Work-in-Progress
- WIP
- Semi Finished Goods
- Semi-Finished Goods
- Work in Process

IMPORTANT:
Retrieve the actual numeric inventory value and the
financial-year column labels.

Do NOT infer WIP from production information or narrative.
`,

  finishedGoods: `
Find the latest financial-year INVENTORY value for
Finished Goods.

PRIORITY:
- Balance Sheet
- Inventories note
- Inventory schedule
- Financial-year table containing numeric values

Look specifically for:
- Finished Goods
- Finished Products
- Finished Goods Inventory
- Finished Stock

IMPORTANT:
Retrieve the actual numeric inventory value and the
financial-year column labels.

Do NOT infer finished-goods inventory from sales,
production quantity, inventory turnover, or commentary.
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

