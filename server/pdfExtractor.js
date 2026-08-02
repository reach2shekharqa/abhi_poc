import { PDFParse } from "pdf-parse";


/*
 * ============================================================
 * PDF TEXT EXTRACTION
 * ============================================================
 *
 * Extracts the text layer from the uploaded PDF Buffer.
 *
 * The PDF is NOT saved to disk here.
 *
 * Flow:
 *
 * Uploaded PDF Buffer
 *        ↓
 * PDFParse
 *        ↓
 * Raw text
 *
 * OCR-generated text is supported when that OCR text
 * is embedded in the PDF text layer.
 * ============================================================
 */

export async function extractTextFromPdf(
  fileBuffer,
) {

  if (
    !fileBuffer ||
    !Buffer.isBuffer(fileBuffer)
  ) {

    throw new Error(
      "Invalid PDF buffer supplied for extraction.",
    );
  }


  const parser =
    new PDFParse({
      data:
        fileBuffer,
    });


  try {

    const result =
      await parser.getText();


    return (
      result?.text?.trim() ||
      ""
    );

  } finally {

    await parser.destroy();

  }
}


/*
 * ============================================================
 * TEXT CLEANING
 * ============================================================
 *
 * Keeps the actual PDF content while removing common
 * extraction noise.
 * ============================================================
 */

export function cleanPdfText(
  text,
) {

  if (!text) {
    return "";
  }


  return text
    .replace(
      /\u0000/g,
      " ",
    )
    .replace(
      /\r/g,
      "",
    )
    .replace(
      /[ \t]+/g,
      " ",
    )
    .replace(
      /\n{3,}/g,
      "\n\n",
    )
    .trim();
}