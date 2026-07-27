export interface ReportData {
  category: string;
  amount: number;
}


export function parseReport(text: string): ReportData[] {

  const result: ReportData[] = [];


  // Remove heading
  text = text.replace(
    /Monthly Expense Report/gi,
    ""
  );


  // Find all Category: Amount pairs
  const regex =
    /([A-Za-z]+)\s*:\s*([\d,]+)/g;


  let match;


  while ((match = regex.exec(text)) !== null) {

    const category = match[1].trim();

    const amount = Number(
      match[2].replace(/,/g, "")
    );


    result.push({
      category,
      amount
    });

  }


  return result;
}