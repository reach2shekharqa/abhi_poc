export async function extractPdfText(file: File): Promise<string> {
  throw new Error(
    "Legacy client-side PDF extraction has been disabled. Use the server-side LlamaParse pipeline instead."
  );
}
