import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs`;


export async function extractPdfText(file: File): Promise<string> {

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer
  }).promise;


  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {

    const page = await pdf.getPage(i);

    const content = await page.getTextContent();

    const items = content.items as Array<{
      str: string;
      transform: number[];
    }>;

    const lineMap = new Map<number, Array<{ x: number; str: string }>>();

    for (const item of items) {
      const y = Math.round((item.transform?.[5] ?? 0) * 10) / 10;
      const x = item.transform?.[4] ?? 0;
      const line = lineMap.get(y) ?? [];
      line.push({ x, str: item.str });
      lineMap.set(y, line);
    }

    const lines = Array.from(lineMap.entries())
      .sort((left, right) => right[0] - left[0])
      .map(([, groupedItems]) =>
        groupedItems
          .sort((left, right) => left.x - right.x)
          .map((entry) => entry.str)
          .join(" ")
          .trim(),
      )
      .filter(Boolean);

    fullText += lines.join("\n") + "\n";
  }


  return fullText;
}