import express from "express";
import cors from "cors";
import multer from "multer";

import {
  port,
  groqApiKey,
  groqModel,
} from "./config.js";

import {
  extractTextFromPdf,
} from "./pdfExtractor.js";

import {
  cleanPdfText,
} from "./textUtils.js";

import {
  detectReportingUnit,
} from "./reportingUnit.js";

import {
  extractRelevantFinancialContext,
} from "./extractRelevantFinancialContext.js";

import {
  extractWithGroq,
} from "./groqExtractor.js";

import {
  defaultExtractionResponse,
  normalizeExtraction,
} from "./metrics.js";


/*
 * ============================================================
 * APP
 * ============================================================
 */

const app =
  express();


app.use(
  cors(),
);


app.use(
  express.json({
    limit: "10mb",
  }),
);


/*
 * ============================================================
 * MULTER
 * ============================================================
 */

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        25 * 1024 * 1024,
    },

    fileFilter: (
      req,
      file,
      callback,
    ) => {

      const isPdf =
        file.mimetype ===
          "application/pdf" ||
        file.originalname
          .toLowerCase()
          .endsWith(".pdf");


      if (!isPdf) {

        return callback(
          new Error(
            "Only PDF files are supported.",
          ),
        );

      }


      callback(
        null,
        true,
      );

    },
  });


/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get(
  "/",
  (req, res) => {

    res.json({
      success:
        true,

      service:
        "PDF Dashboard AI Extraction Server",

      model:
        groqModel,

      pipeline:
        "PDF -> text -> local embeddings -> FAISS -> relevant evidence -> Groq -> metrics",
    });

  },
);


/*
 * ============================================================
 * PDF EXTRACTION API
 * ============================================================
 */

app.post(
  "/api/extract",

  upload.single(
    "file",
  ),

  async (
    req,
    res,
  ) => {

    try {

      /*
       * --------------------------------------------------------
       * REQUEST INFORMATION
       * --------------------------------------------------------
       */

      const documentType =
        req.body
          ?.documentType ||
        "financial";


      const pdfFile =
        req.file;


      console.log(
        "\n========================================",
      );


      console.log(
        "PDF EXTRACTION REQUEST",
      );


      console.log(
        "DOCUMENT TYPE:",
        documentType,
      );


      console.log(
        "FILE:",
        pdfFile?.originalname,
      );


      console.log(
        "SIZE:",
        pdfFile?.size,
      );


      console.log(
        "========================================",
      );


      /*
       * --------------------------------------------------------
       * GROQ KEY
       * --------------------------------------------------------
       */

      if (!groqApiKey) {

        return res
          .status(500)
          .json({

            success:
              false,

            message:
              "Missing GROQ_API_KEY environment variable.",

            metrics:
              defaultExtractionResponse,

          });

      }


      /*
       * --------------------------------------------------------
       * FILE VALIDATION
       * --------------------------------------------------------
       */

      if (!pdfFile) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Missing PDF file. Expected multipart field 'file'.",

            metrics:
              defaultExtractionResponse,

          });

      }


      /*
       * --------------------------------------------------------
       * DOCUMENT TYPE VALIDATION
       * --------------------------------------------------------
       */

      const supportedDocumentTypes = [
        "financial",
        "stock",
        "gst",
      ];


      if (
        !supportedDocumentTypes.includes(
          documentType,
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid documentType. Expected financial, stock, or gst.",

            metrics:
              defaultExtractionResponse,

          });

      }


      /*
       * ========================================================
       * STEP 1
       * PDF -> TEXT
       * ========================================================
       */

      console.log(
        "[PDF] Extracting embedded/OCR text...",
      );


      const rawText =
        await extractTextFromPdf(
          pdfFile.buffer,
        );


      console.log(
        "[PDF] Raw extracted text length:",
        rawText.length,
      );


      if (!rawText) {

        return res
          .status(422)
          .json({

            success:
              false,

            message:
              "The PDF contains no readable text layer. Please provide a PDF with OCR/text content.",

            metrics:
              defaultExtractionResponse,

          });

      }


      /*
       * ========================================================
       * STEP 2
       * CLEAN TEXT
       * ========================================================
       */

      const cleanedText =
        cleanPdfText(
          rawText,
        );


      console.log(
        "[PDF] Cleaned text length:",
        cleanedText.length,
      );


      if (!cleanedText) {

        return res
          .status(422)
          .json({

            success:
              false,

            message:
              "No usable text could be extracted from the PDF.",

            metrics:
              defaultExtractionResponse,

          });

      }


      /*
       * ========================================================
       * STEP 3
       * DETECT REPORTING UNIT
       * ========================================================
       */

      const reportingUnit =
        detectReportingUnit(
          cleanedText,
        );


      console.log(
        "[PDF] Reporting unit:",
        reportingUnit,
      );


      /*
       * ========================================================
       * STEP 4
       * SEMANTIC RETRIEVAL
       * ========================================================
       *
       * IMPORTANT:
       *
       * The complete PDF is still local.
       *
       * PDF
       *  ↓
       * text
       *  ↓
       * chunks
       *  ↓
       * local embeddings
       *  ↓
       * FAISS
       *  ↓
       * relevant evidence
       *
       * Only relevant evidence goes to Groq.
       * ========================================================
       */

      const relevantContext =
        await extractRelevantFinancialContext({
          cleanedText,
          documentType,
        });


      if (!relevantContext) {

        return res
          .status(422)
          .json({

            success:
              false,

            message:
              "Could not identify relevant financial evidence from the PDF.",

            metrics:
              defaultExtractionResponse,

            unit:
              reportingUnit,

          });

      }


      /*
       * ========================================================
       * DEBUG
       * ========================================================
       */

      console.log(
        "\n========================================",
      );


      console.log(
        "RELEVANT EVIDENCE PREVIEW:",
      );


      console.log(
        relevantContext.substring(
          0,
          12000,
        ),
      );


      console.log(
        "========================================",
      );


      /*
       * ========================================================
       * STEP 5
       * GROQ EXTRACTION
       * ========================================================
       *
       * Groq receives ONLY relevantContext.
       *
       * It does NOT receive the original PDF.
       * ========================================================
       */

      const parsedJson =
        await extractWithGroq({

          documentType,

          relevantContext,

          reportingUnit,

        });


      /*
       * ========================================================
       * STEP 6
       * NORMALIZE METRICS
       * ========================================================
       */

      const metrics =
        normalizeExtraction(
          parsedJson,
        );


      /*
       * ========================================================
       * FINAL LOG
       * ========================================================
       */

      console.log(
        "\n========================================",
      );


      console.log(
        "PARSED GROQ RESPONSE:",
      );


      console.log(
        parsedJson,
      );


      console.log(
        "REPORTING UNIT:",
        reportingUnit,
      );


      console.log(
        "\nNORMALIZED METRICS:",
      );


      console.log(
        metrics,
      );


      console.log(
        "========================================\n",
      );


      /*
       * ========================================================
       * RESPONSE
       * ========================================================
       */

      return res.json({

        success:
          true,

        metrics,

        unit:
          reportingUnit,

      });

    } catch (error) {

      /*
       * ========================================================
       * ERROR
       * ========================================================
       */

      console.error(
        "\n========================================",
      );


      console.error(
        "EXTRACTION ENDPOINT ERROR",
      );


      console.error(
        error,
      );


      console.error(
        "========================================\n",
      );


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Failed to process PDF extraction.",

          details:
            error instanceof Error
              ? error.message
              : String(error),

          metrics:
            defaultExtractionResponse,

        });

    }

  },
);


/*
 * ============================================================
 * MULTER / GENERAL ERROR HANDLER
 * ============================================================
 */

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {

    console.error(
      "Server middleware error:",
      error,
    );


    /*
     * --------------------------------------------------------
     * MULTER ERROR
     * --------------------------------------------------------
     */

    if (
      error instanceof
      multer.MulterError
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          message:
            `File upload error: ${error.message}`,

          metrics:
            defaultExtractionResponse,

        });

    }


    /*
     * --------------------------------------------------------
     * INVALID FILE TYPE
     * --------------------------------------------------------
     */

    if (
      error?.message ===
      "Only PDF files are supported."
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          message:
            "Only PDF files are supported.",

          metrics:
            defaultExtractionResponse,

        });

    }


    /*
     * --------------------------------------------------------
     * GENERAL ERROR
     * --------------------------------------------------------
     */

    return res
      .status(500)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",

        metrics:
          defaultExtractionResponse,

      });

  },
);


/*
 * ============================================================
 * START SERVER
 * ============================================================
 */

app.listen(
  port,
  () => {

    console.log(
      `LLM extraction server running on http://localhost:${port}`,
    );


    console.log(
      `Groq model: ${groqModel}`,
    );


    console.log(
      "Pipeline: PDF -> PDF/OCR text -> local embeddings -> FAISS -> metric evidence -> Groq -> dashboard metrics",
    );

  },
);