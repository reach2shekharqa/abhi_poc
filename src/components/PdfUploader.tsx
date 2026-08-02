
import { useMemo, useState } from "react";

import { extractMetricsWithLlm } from "../services/llmExtractionService";

import type {
  EntityRecord,
  ExtractionMetrics,
  UploadedDocument,
  UserAccount,
} from "../types";

import type { ReportData } from "../parser/reportParser";


interface Props {
  entities: EntityRecord[];
  currentUser: UserAccount;
  onUpload: (document: UploadedDocument) => void;

  onParsedData?: (payload: {
    documentType: "financial" | "stock" | "gst";
    parsedData: ReportData[];
    unit?: string;
  }) => void;
}


const documentTypes =
  ["financial", "stock", "gst"] as const;


/*
 * ============================================================
 * FINANCIAL METRIC LABELS
 * ============================================================
 *
 * These keys MUST match the backend metrics exactly.
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
 * No calculations are performed here.
 * ============================================================
 */

const FINANCIAL_LABELS: Record<
  keyof ExtractionMetrics,
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

  rawMaterial:
    "Raw Material",

  workInProgress:
    "Work in Progress",

  finishedGoods:
    "Finished Goods",
};


/*
 * ============================================================
 * CONVERT API METRICS -> REPORT DATA
 * ============================================================
 *
 * IMPORTANT:
 *
 * The backend has already done:
 *
 * PDF
 * ↓
 * text extraction
 * ↓
 * FAISS retrieval
 * ↓
 * Groq extraction
 * ↓
 * metric normalization
 *
 * Therefore the frontend MUST NOT:
 *
 * - recalculate values
 * - rediscover values
 * - parse arbitrary PDF text
 * - create fallback financial values
 *
 * It simply maps the structured API response.
 * ============================================================
 */

function metricsToReportData(
  metrics: ExtractionMetrics,
  documentType:
    | "financial"
    | "stock"
    | "gst",
): ReportData[] {

  const keys: (keyof ExtractionMetrics)[] =
    documentType === "stock"
      ? [
          "rawMaterial",
          "workInProgress",
          "finishedGoods",
        ]
      : documentType === "financial"
        ? [
            "revenue",
            "fixedAssets",
            "cashAndBalance",
            "debtors",
            "creditors",
            "borrowings",
            "operatingProfit",
            "netProfit",
            "financeCost",
          ]
        : [];


  return keys
    .map(
      (key) => {

        const amount =
          Number(
            metrics[key],
          );


        return {
          category:
            FINANCIAL_LABELS[key],

          amount:
            Number.isFinite(amount)
              ? amount
              : 0,
        };
      },
    )
    .filter(
      (item) =>
        item.amount > 0,
    );
}


/*
 * ============================================================
 * PDF UPLOADER
 * ============================================================
 */

export default function PdfUploader({
  entities,
  currentUser,
  onUpload,
  onParsedData,
}: Props) {

  const [
    selectedEntityName,
    setSelectedEntityName,
  ] = useState<string>(
    entities[0]?.name ?? "",
  );


  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);


  const [
    fileName,
    setFileName,
  ] = useState<string>(
    "sample-upload.pdf",
  );


  const [
    documentType,
    setDocumentType,
  ] = useState<
    (typeof documentTypes)[number]
  >("financial");


  const [
    month,
    setMonth,
  ] = useState<string>("Jan");


  const [
    year,
    setYear,
  ] = useState<number>(2025);


  const [
    fileFormat,
    setFileFormat,
  ] = useState<string>("pdf");


  const [
    loading,
    setLoading,
  ] = useState<boolean>(false);


  const [
    status,
    setStatus,
  ] = useState<string>("");


  /*
   * ==========================================================
   * ENTITY OPTIONS
   * ==========================================================
   */

  const entityOptions = useMemo(
    () =>
      entities.map(
        (entity) => ({
          id: entity.id,
          name: entity.name,
        }),
      ),
    [entities],
  );


  /*
   * ==========================================================
   * FILE SELECTION
   * ==========================================================
   */

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {

    const nextFile =
      event.target.files?.[0];


    if (!nextFile) {
      return;
    }


    const isPdf =
      nextFile.type === "application/pdf" ||
      nextFile.name
        .toLowerCase()
        .endsWith(".pdf");


    if (!isPdf) {

      setSelectedFile(null);

      setStatus(
        "Please select a PDF file.",
      );

      return;
    }


    setSelectedFile(nextFile);

    setFileName(nextFile.name);

    setFileFormat(
      nextFile.name
        .split(".")
        .pop() ?? "pdf",
    );


    setStatus(
      "PDF selected. Click Submit Upload to process it.",
    );


    console.log(
      "[Uploader] PDF selected:",
      nextFile.name,
    );

    console.log(
      "[Uploader] PDF size:",
      nextFile.size,
    );
  }


  /*
   * ==========================================================
   * SUBMIT UPLOAD
   * ==========================================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();


    if (!selectedFile) {

      setStatus(
        "Please select a PDF file first.",
      );

      return;
    }


    setLoading(true);

    setStatus(
      "Uploading PDF and extracting financial data...",
    );


    try {

      console.log(
        "\n========================================",
      );

      console.log(
        "[Uploader] Starting PDF upload:",
        selectedFile.name,
      );

      console.log(
        "[Uploader] Document type:",
        documentType,
      );

      console.log(
        "[Uploader] File size:",
        selectedFile.size,
      );

      console.log(
        "========================================",
      );


      /*
       * ======================================================
       * SEND PDF TO BACKEND
       * ======================================================
       *
       * The backend performs:
       *
       * PDF
       * ↓
       * PDF text extraction
       * ↓
       * local embeddings
       * ↓
       * FAISS
       * ↓
       * relevant evidence
       * ↓
       * Groq
       * ↓
       * normalized metrics
       *
       * The browser does NOT parse the PDF.
       */

      const {
        metrics: llmMetrics,
        unit: reportingUnit,
      } =
        await extractMetricsWithLlm(
          documentType,
          selectedFile,
        );


      console.log(
        "[Uploader] LLM metrics received:",
        llmMetrics,
      );


      console.log(
        "[Uploader] Reporting unit:",
        reportingUnit,
      );


      /*
       * ======================================================
       * STRUCTURED METRICS -> DASHBOARD DATA
       * ======================================================
       */

      const parsedData =
        metricsToReportData(
          llmMetrics,
          documentType,
        );


      console.log(
        "[Uploader] Dashboard data:",
        parsedData,
      );


      /*
       * ======================================================
       * UPDATE DASHBOARD
       * ======================================================
       */

      onParsedData?.({
        documentType,
        parsedData,
        unit: reportingUnit,
      });


      /*
       * ======================================================
       * CREATE UPLOAD RECORD
       * ======================================================
       */

      const documentRecord:
        UploadedDocument = {

        id:
          `doc-${Date.now()}`,

        userId:
          currentUser.userId,

        entityName:
          selectedEntityName,

        type:
          documentType,

        fileName,

        fileFormat,

        month,

        year,

        timestamp:
          new Date().toISOString(),
      };


      onUpload(
        documentRecord,
      );


      /*
       * ======================================================
       * SUCCESS
       * ======================================================
       */

      setStatus(
        parsedData.length > 0
          ? `Parsed ${parsedData.length} ${documentType} metrics and refreshed the dashboard.`
          : "PDF processed, but no dashboard metrics were extracted.",
      );


      console.log(
        "[Uploader] PDF processing completed successfully.",
      );


    } catch (error) {

      console.error(
        "[Uploader] PDF processing failed:",
        error,
      );


      setStatus(
        error instanceof Error
          ? `PDF processing failed: ${error.message}`
          : "The selected PDF could not be processed.",
      );

    } finally {

      setLoading(false);
    }
  }


  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
    >

      <div className="rounded-3xl border border-dashed border-cyan-400/40 p-8 text-center">

        <div className="text-5xl">
          📄
        </div>


        <h2 className="mt-4 text-2xl font-semibold">
          Upload Financial Statement / Stock Statement / GST Return
        </h2>


        <p className="mt-2 text-sm text-slate-300">
          Select a PDF, then click Submit Upload to process it and refresh the dashboard.
        </p>

      </div>


      <div className="grid gap-3 md:grid-cols-2">

        <select
          className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
          value={selectedEntityName}
          onChange={(event) =>
            setSelectedEntityName(
              event.target.value,
            )
          }
        >

          {entityOptions.map(
            (entity) => (

              <option
                key={entity.id}
                value={entity.name}
              >
                {entity.name}
              </option>

            ),
          )}

        </select>


        <select
          className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
          value={documentType}
          onChange={(event) =>
            setDocumentType(
              event.target.value as
                (typeof documentTypes)[number],
            )
          }
        >

          {documentTypes.map(
            (type) => (

              <option
                key={type}
                value={type}
              >
                {type}
              </option>

            ),
          )}

        </select>


        <select
          className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
          value={month}
          onChange={(event) =>
            setMonth(
              event.target.value,
            )
          }
        >

          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map(
            (item) => (

              <option
                key={item}
                value={item}
              >
                {item}
              </option>

            ),
          )}

        </select>


        <input
          className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3"
          type="number"
          value={year}
          onChange={(event) =>
            setYear(
              Number(
                event.target.value,
              ),
            )
          }
        />

      </div>


      <label className="rounded-2xl border border-white/20 bg-slate-950/40 px-4 py-3">

        <span className="block text-sm text-slate-300">
          Choose file
        </span>


        <input
          type="file"
          accept=".pdf,application/pdf"
          className="mt-2 w-full"
          onChange={
            handleFileSelection
          }
        />

      </label>


      <div className="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm text-cyan-200">
        Selected file: {fileName}
      </div>


      {status && (

        <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-cyan-100">
          {status}
        </div>

      )}


      {loading && (

        <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-cyan-100">
          Uploading PDF and extracting financial data…
        </div>

      )}


      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Processing PDF…"
          : "Submit Upload"}
      </button>

    </form>
  );
}

