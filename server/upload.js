import multer from "multer";

import {
  maxPdfSize,
} from "./config.js";


/*
 * ============================================================
 * MULTER CONFIGURATION
 * ============================================================
 *
 * PDFs are kept in memory.
 *
 * The file is NOT saved to disk by this upload layer.
 * It is passed to the PDF extraction pipeline as a Buffer.
 *
 * Maximum PDF size:
 * 25 MB
 * ============================================================
 */

export const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        maxPdfSize,
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