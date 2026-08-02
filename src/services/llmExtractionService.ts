import type { ExtractionMetrics } from "../types";

interface ExtractResponse {
  success: boolean;
  metrics: ExtractionMetrics;
  unit?: string;
  message?: string;
  details?: string;
}

const emptyMetrics: ExtractionMetrics = {
  revenue: 0,
  fixedAssets: 0,
  cashAndBalance: 0,
  debtors: 0,
  creditors: 0,
  borrowings: 0,
  operatingProfit: 0,
  netProfit: 0,
  financeCost: 0,
  rawMaterial: 0,
  workInProgress: 0,
  finishedGoods: 0,
};


/**
 * Upload the original PDF to our backend.
 *
 * IMPORTANT:
 * The PDF is NOT sent directly to Groq.
 *
 * Flow:
 *
 * Browser
 *   ↓
 * PDF file
 *   ↓
 * /api/extract
 *   ↓
 * server.js
 *   ↓
 * PDFParse
 *   ↓
 * relevant text filtering
 *   ↓
 * Groq
 *   ↓
 * metrics
 */
export async function extractMetricsWithLlm(
  documentType: "financial" | "stock" | "gst",
  file: File,
): Promise<{ metrics: ExtractionMetrics; unit: string }> {

  try {

    console.log(
      "[LLM] Preparing PDF upload...",
    );

    console.log(
      "[LLM] File:",
      file.name,
    );

    console.log(
      "[LLM] File size:",
      file.size,
      "bytes",
    );

    console.log(
      "[LLM] Document type:",
      documentType,
    );


    /*
     * --------------------------------------------------------
     * Create multipart form data.
     * --------------------------------------------------------
     *
     * The PDF goes to our Node backend.
     *
     * We DO NOT set Content-Type manually.
     *
     * Browser automatically adds:
     *
     * multipart/form-data; boundary=...
     */

    const formData = new FormData();

    formData.append(
      "file",
      file,
      file.name,
    );

    formData.append(
      "documentType",
      documentType,
    );


    const baseApiUrl =
      import.meta.env.DEV
        ? "http://localhost:3001/api"
        : import.meta.env.VITE_API_BASE_URL || "/api";

    const extractUrl = `${baseApiUrl.replace(/\/$/, "")}/extract`;

    console.log(
      `[LLM] Calling ${extractUrl}...`,
    );


    /*
     * --------------------------------------------------------
     * Send PDF to our backend.
     * --------------------------------------------------------
     */

    const response = await fetch(
      extractUrl,
      {
        method: "POST",
        body: formData,
      },
    );


    console.log(
      "[LLM] Backend response status:",
      response.status,
    );


    /*
     * --------------------------------------------------------
     * Read response.
     * --------------------------------------------------------
     */

    const responseText =
      await response.text();


    console.log(
      "[LLM] Backend response:",
      responseText,
    );


    /*
     * --------------------------------------------------------
     * Handle HTTP errors.
     * --------------------------------------------------------
     */

    if (!response.ok) {

      throw new Error(
        `PDF extraction failed: ${response.status} ${responseText}`,
      );
    }


    /*
     * --------------------------------------------------------
     * Parse JSON.
     * --------------------------------------------------------
     */

    let payload: ExtractResponse;

    try {

      payload =
        JSON.parse(
          responseText,
        ) as ExtractResponse;

    } catch {

      throw new Error(
        "Backend returned an invalid JSON response.",
      );
    }


    /*
     * --------------------------------------------------------
     * Validate backend response.
     * --------------------------------------------------------
     */

    if (!payload.success) {

      throw new Error(
        payload.message ||
          "PDF extraction failed on the server.",
      );
    }


    /*
     * --------------------------------------------------------
     * Validate metrics.
     * --------------------------------------------------------
     */

    if (!payload.metrics) {

      throw new Error(
        "Backend did not return metrics.",
      );
    }


    console.log(
      "[LLM] Final metrics received:",
      payload.metrics,
    );

    return {
      metrics: payload.metrics,
      unit: payload.unit || "",
    };

  } catch (error) {

    console.error(
      "[LLM] PDF extraction failed:",
      error,
    );

    /*
     * Returning zero metrics keeps the dashboard
     * from crashing if extraction fails.
     */

    return {
      metrics: {
        ...emptyMetrics,
      },
      unit: "",
    };
  }
}