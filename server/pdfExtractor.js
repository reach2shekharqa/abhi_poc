import { createReadStream } from "fs";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import LlamaCloud from "@llamaindex/llama-cloud";
import { llamaCloudApiKey } from "./config.js";

const CACHE_DIR = path.join(os.tmpdir(), "pdf-extraction-cache");

/*
 * ============================================================
 * LLAMAPARSE PDF EXTRACTION WITH CACHING
 * ============================================================
 *
 * Uses LlamaParse cloud to convert PDFs into structured
 * Markdown with table preservation. Results are cached
 * by file hash to preserve API quota (1000 pages/day).
 * ============================================================
 */

/**
 * Compute MD5 hash of PDF buffer for cache lookup
 */
function getFileHash(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error(`[CACHE] Failed to create cache directory: ${err.message}`);
  }
}

/**
 * Get cached Markdown result by file hash
 */
function isParseResultCache(text) {
  if (!text) {
    return false;
  }

  const trimmed = text.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return false;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return (
      parsed &&
      typeof parsed === "object" &&
      (parsed.job_id || parsed.markdown || parsed.pages || parsed.text)
    );
  } catch (err) {
    return false;
  }
}

async function getCachedMarkdown(fileHash) {
  try {
    const cachePath = path.join(CACHE_DIR, `${fileHash}.md`);
    const cached = await fs.readFile(cachePath, "utf-8");
    if (isParseResultCache(cached)) {
      console.warn(
        `[CACHE] Invalid JSON cache detected for hash ${fileHash}, regenerating.`,
      );
      await fs.rm(cachePath, { force: true });
      return null;
    }

    console.log(`[CACHE] Cache HIT for hash ${fileHash}`);
    return cached;
  } catch (err) {
    // Cache miss is expected; return null
    return null;
  }
}

/**
 * Save Markdown result to cache by file hash
 */
async function saveCachedMarkdown(fileHash, markdown) {
  try {
    const cachePath = path.join(CACHE_DIR, `${fileHash}.md`);
    await fs.writeFile(cachePath, markdown, "utf-8");
    console.log(`[CACHE] Cache SAVED for hash ${fileHash}`);
  } catch (err) {
    console.error(`[CACHE] Failed to save cache: ${err.message}`);
  }
}

function normalizeParseResult(parseResult) {
  if (typeof parseResult === "string") {
    return parseResult;
  }

  if (parseResult == null) {
    return "";
  }

  let pagesArray = [];
  if (Array.isArray(parseResult?.markdown?.pages)) {
    pagesArray = parseResult.markdown.pages;
  } else if (Array.isArray(parseResult?.pages)) {
    pagesArray = parseResult.pages;
  }

  if (pagesArray.length > 0) {
    return pagesArray
      .map((page) => page.markdown || page.text || "")
      .filter(Boolean)
      .join("\n\n--- Page Break ---\n\n");
  }

  if (Array.isArray(parseResult.documents)) {
    return parseResult.documents
      .map((doc) => doc.markdown || doc.text || "")
      .filter(Boolean)
      .join("\n\n--- Page Break ---\n\n");
  }

  if (typeof parseResult.markdown === "string") {
    return parseResult.markdown;
  }

  if (typeof parseResult.text === "string") {
    return parseResult.text;
  }

  return typeof parseResult === "object"
    ? JSON.stringify(parseResult, null, 2)
    : String(parseResult);
}

/**
 * Extract PDF to structured Markdown using LlamaParse
 * with caching to preserve API quota
 */
export async function extractPdfWithLlamaParse(fileBuffer) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("Invalid PDF buffer supplied for extraction.");
  }

  // Check cache first
  await ensureCacheDir();
  const fileHash = getFileHash(fileBuffer);
  const cached = await getCachedMarkdown(fileHash);
  if (cached) {
    return cached;
  }

  // Cache miss: parse with LlamaParse API
  console.log(`[LlamaParse] Cache MISS; parsing PDF (hash: ${fileHash})`);

  let tempPath;
  try {
    // Write PDF to temporary file
    const tempDir = path.join(os.tmpdir(), `llamaparse-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    tempPath = path.join(tempDir, "document.pdf");
    await fs.writeFile(tempPath, fileBuffer);

    const client = new LlamaCloud({ apiKey: llamaCloudApiKey });

    console.log("[LlamaParse] Uploading PDF and parsing...");
    const result = await client.parsing.parse({
      tier: "agentic",
      version: "latest",
      upload_file: createReadStream(tempPath),
      expand: ["markdown"],
    });

    const markdown = normalizeParseResult(result);

    console.log(
      `[LlamaParse] Parsed result type: ${typeof result}; markdown length: ${markdown.length} chars`,
    );

    // Save to cache for future requests
    await saveCachedMarkdown(fileHash, markdown);

    return markdown;
  } finally {
    // Clean up temporary file
    if (tempPath) {
      try {
        const tempDir = path.dirname(tempPath);
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`[LlamaParse] Failed to clean temp file: ${err.message}`);
      }
    }
  }
}

/*
 * ============================================================
 * TEXT CLEANING
 * ============================================================
 *
 * Normalizes Markdown content by removing extraction
 * noise while preserving table structure and formatting.
 * ============================================================
 */
export function cleanPdfText(text) {
  if (!text) {
    return "";
  }

  return text
    .replace(/\u0000/g, " ") // Remove null bytes
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/[ \t]+/g, " ") // Normalize spaces
    .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
    .trim();
}