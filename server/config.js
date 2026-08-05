import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

const envPath = path.resolve(
  __dirname,
  ".env"
);

dotenv.config({
  path: envPath,
});

export const port =
  Number(process.env.PORT || 3001);

export const groqApiKey =
  process.env.GROQ_API_KEY;

export const groqModel =
  process.env.GROQ_MODEL ||
  "llama-3.3-70b-versatile";

export const llamaCloudApiKey =
  process.env.LLAMA_CLOUD_API_KEY;

export const embeddingModelName =
  "Xenova/all-MiniLM-L6-v2";

export const maxPdfSize =
  25 * 1024 * 1024;

export const supportedDocumentTypes = [
  "financial",
  "stock",
  "gst",
];