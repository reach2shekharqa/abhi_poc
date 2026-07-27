export interface ReportData {
  category: string;
  amount: number;
}


export function parseReport(text: string): ReportData[] {

  const result: ReportData[] = [];


  /*
    Matches multiple patterns:

    Food:12000
    Rent:25000
    Travel:5000
  */

  const regex =
    /([A-Za-z\s]+?)\s*[:\-]\s*([\d,]+)/g;


  let match;


  while ((match = regex.exec(text)) !== null) {

    let category = match[1].trim();

    const amount = Number(
      match[2].replace(/,/g, "")
    );


    // Remove unwanted PDF headings
    category = category
      .replace(
        /Monthly Expense Report/gi,
        ""
      )
      .trim();


    // Avoid empty values
    if (category && amount > 0) {

      result.push({
        category,
        amount
      });

    }
  }


  return result;
}