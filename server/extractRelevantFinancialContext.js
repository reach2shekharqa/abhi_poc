import faiss from "faiss-node";

import {
  getMetricQueries,
} from "./metricQueries.js";

import {
  chunkText,
} from "./textUtils.js";

import {
  embeddingModelName,
} from "./config.js";


const {
  IndexFlatIP,
} = faiss;


/*
 * ============================================================
 * RETRIEVAL CONFIGURATION
 * ============================================================
 *
 * These limits are intentionally conservative.
 *
 * The objective is:
 *
 * PDF
 *   ↓
 * chunks
 *   ↓
 * FAISS
 *   ↓
 * small high-quality evidence set
 *   ↓
 * Groq
 *
 * NOT:
 *
 * PDF
 *   ↓
 * FAISS
 *   ↓
 * hundreds of chunks
 *   ↓
 * huge Groq request
 * ============================================================
 */

const TOP_K = 4;

const NEIGHBOUR_DISTANCE = 2;

// Use conservative Groq payload: send up to 10 numeric chunks
// and keep context under ~10k characters so payload is dense.
const MAX_EVIDENCE_CHUNKS = 10;

const MAX_CONTEXT_CHARS = 10000;


/*
 * ============================================================
 * LOCAL EMBEDDING MODEL
 * ============================================================
 */

let embeddingModel = null;


async function getEmbeddingModel() {

  if (!embeddingModel) {

    console.log(
      `[Embeddings] Loading local model: ${embeddingModelName}`,
    );

    const {
      pipeline,
    } =
      await import(
        "@xenova/transformers"
      );

    embeddingModel =
      await pipeline(
        "feature-extraction",
        embeddingModelName,
      );

    console.log(
      "[Embeddings] Local model ready.",
    );
  }

  return embeddingModel;
}


/*
 * ============================================================
 * NORMALIZE EMBEDDING
 * ============================================================
 */

function normalizeEmbeddingOutput(
  output,
  label = "embedding",
) {

  let values;


  if (
    output &&
    output.data
  ) {

    values =
      Array.from(
        output.data,
      );

  }

  else if (
    output instanceof
    Float32Array
  ) {

    values =
      Array.from(
        output,
      );

  }

  else if (
    Array.isArray(output)
  ) {

    values =
      output.flat(
        Infinity,
      );

  }

  else {

    throw new Error(
      `[Embeddings] Unsupported ${label} output.`,
    );

  }


  if (
    !values.length
  ) {

    throw new Error(
      `[Embeddings] Empty ${label} generated.`,
    );

  }


  const vector =
    values.map(
      Number,
    );


  if (
    vector.some(
      (value) =>
        !Number.isFinite(
          value,
        ),
    )
  ) {

    throw new Error(
      `[Embeddings] Invalid numeric value in ${label}.`,
    );

  }


  return vector;
}


/*
 * ============================================================
 * EMBED TEXT
 * ============================================================
 */

async function createEmbedding(
  embedder,
  text,
  label,
) {

  const output =
    await embedder(
      text,
      {
        pooling:
          "mean",

        normalize:
          true,
      },
    );


  return normalizeEmbeddingOutput(
    output,
    label,
  );
}


/*
 * ============================================================
 * ADD VECTORS TO FAISS
 * ============================================================
 */

function flattenVectors(
  vectors,
) {

  const flat = [];


  for (
    const vector
    of vectors
  ) {

    for (
      const value
      of vector
    ) {

      flat.push(
        Number(value),
      );

    }

  }


  return flat;
}


/*
 * ============================================================
 * ADD CHUNK TO SELECTION
 * ============================================================
 *
 * IMPORTANT:
 *
 * The same PDF chunk can be relevant to multiple metrics.
 *
 * Example:
 *
 * Chunk 25:
 *
 * Cash
 * Trade Receivables
 * Trade Payables
 * Borrowings
 *
 * That chunk should be sent to Groq ONLY ONCE.
 *
 * We therefore deduplicate by:
 *
 *     chunkIndex
 *
 * rather than:
 *
 *     metric + chunkIndex
 *
 * ============================================================
 */

function addChunk(
  selected,
  chunks,
  chunkIndex,
  metric,
  score,
) {

  if (
    !Number.isInteger(
      chunkIndex,
    ) ||
    chunkIndex < 0 ||
    chunkIndex >= chunks.length
  ) {

    return;

  }


  const existing =
    selected.get(
      chunkIndex,
    );


  /*
   * ----------------------------------------------------------
   * New chunk
   * ----------------------------------------------------------
   */

  if (!existing) {

    selected.set(
      chunkIndex,
      {
        chunkIndex,

        score,

        metrics:
          new Set([
            metric,
          ]),

        text:
          chunks[chunkIndex],
      },
    );

    return;

  }


  /*
   * ----------------------------------------------------------
   * Same chunk matched another metric.
   *
   * Keep it only once but remember all relevant metrics.
   * ----------------------------------------------------------
   */

  existing.metrics.add(
    metric,
  );


  /*
   * Keep the strongest semantic score.
   */

  if (
    score >
    existing.score
  ) {

    existing.score =
      score;

  }

}


/*
 * ============================================================
 * ADD CHUNK + NEIGHBOURS
 * ============================================================
 */

function addChunkWithNeighbours(
  selected,
  chunks,
  chunkIndex,
  metric,
  score,
  neighbourDistance,
) {

  /*
   * Main semantic match.
   */

  addChunk(
    selected,
    chunks,
    chunkIndex,
    metric,
    score,
  );


  /*
   * ----------------------------------------------------------
   * Add neighbouring chunks.
   *
   * Neighbours are deliberately weaker.
   * ----------------------------------------------------------
   */

  for (
    let distance = 1;
    distance <=
      neighbourDistance;
    distance++
  ) {

    const before =
      chunkIndex -
      distance;


    const after =
      chunkIndex +
      distance;


    const neighbourScore =
      score -
      distance *
        0.05;


    if (
      before >= 0
    ) {

      addChunk(
        selected,
        chunks,
        before,
        metric,
        neighbourScore,
      );

    }


    if (
      after <
      chunks.length
    ) {

      addChunk(
        selected,
        chunks,
        after,
        metric,
        neighbourScore,
      );

    }

  }

}


/*
 * ============================================================
 * FORMAT EVIDENCE
 * ============================================================
 */

function formatEvidence(
  item,
) {

  const metrics =
    Array.from(
      item.metrics,
    ).join(
      ", ",
    );


  return (
    `\n[Metrics: ${metrics} | ` +
    `Score: ${item.score.toFixed(4)} | ` +
    `Chunk: ${item.chunkIndex}]\n` +
    item.text
  );

}


/*
 * ============================================================
 * BUILD LIMITED CONTEXT
 * ============================================================
 *
 * We enforce TWO safety limits:
 *
 * 1. Maximum number of chunks.
 * 2. Maximum character count.
 *
 * This prevents accidental Groq token explosions.
 * ============================================================
 */

function buildLimitedContext(
  evidence,
) {

  const selectedEvidence = [];

  let totalCharacters = 0;


  for (
    const item
    of evidence
  ) {

    if (
      selectedEvidence.length >=
      MAX_EVIDENCE_CHUNKS
    ) {

      break;

    }


    const formatted =
      formatEvidence(
        item,
      );


    /*
     * --------------------------------------------------------
     * Stop before exceeding character budget.
     * --------------------------------------------------------
     */

    if (
      totalCharacters +
        formatted.length >
      MAX_CONTEXT_CHARS
    ) {

      /*
       * If this is the first item and it itself is too large,
       * take a safe truncated version.
       */

      if (
        selectedEvidence.length ===
        0
      ) {

        const remaining =
          MAX_CONTEXT_CHARS;


        selectedEvidence.push(
          formatted.slice(
            0,
            remaining,
          ),
        );

        totalCharacters =
          remaining;

      }


      break;

    }


    selectedEvidence.push(
      formatted,
    );


    totalCharacters +=
      formatted.length;

  }


  return {
    context:
      selectedEvidence.join(
        "\n",
      ),

    count:
      selectedEvidence.length,

    characters:
      totalCharacters,
  };

}


/*
 * ============================================================
 * SEMANTIC RETRIEVAL
 * ============================================================
 */

export async function extractRelevantFinancialContext({
  cleanedText,
  documentType,
  markdownChunks = [],
}) {

  if (!cleanedText) {

    return "";

  }


  /*
   * ----------------------------------------------------------
   * CHUNK PDF
   * ----------------------------------------------------------
   */

  const pageBlocks =
    Array.isArray(markdownChunks) &&
    markdownChunks.length > 0
      ? markdownChunks
      : cleanedText.includes("--- Page Break ---")
          ? cleanedText
              .split(/\n{2}--- Page Break ---\n{2}/g)
              .map((block) => block.trim())
              .filter(Boolean)
          : [cleanedText.trim()];

  const chunks = pageBlocks.flatMap((page) =>
    chunkText(
      page,
      1800,
      400,
    ),
  );


  if (!chunks.length) {

    return "";

  }


  console.log(
    `[FAISS] Creating embeddings for ${chunks.length} PDF chunks...`,
  );


  /*
   * ----------------------------------------------------------
   * EMBEDDING MODEL
   * ----------------------------------------------------------
   */

  const embedder =
    await getEmbeddingModel();


  /*
   * ----------------------------------------------------------
   * CREATE CHUNK EMBEDDINGS
   * ----------------------------------------------------------
   */

  const chunkEmbeddings = [];


  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {

    const vector =
      await createEmbedding(
        embedder,
        chunks[i],
        `chunk ${i}`,
      );


    chunkEmbeddings.push(
      vector,
    );

  }


  /*
   * ----------------------------------------------------------
   * VALIDATE DIMENSION
   * ----------------------------------------------------------
   */

  const dimension =
    chunkEmbeddings[0]
      .length;


  console.log(
    `[FAISS] Embedding dimension: ${dimension}`,
  );


  for (
    let i = 0;
    i < chunkEmbeddings.length;
    i++
  ) {

    if (
      chunkEmbeddings[i].length !==
      dimension
    ) {

      throw new Error(
        `[FAISS] Invalid embedding dimension at chunk ${i}. ` +
        `Expected ${dimension}, received ${chunkEmbeddings[i].length}`,
      );

    }

  }


  /*
   * ----------------------------------------------------------
   * CREATE FAISS INDEX
   * ----------------------------------------------------------
   */

  const index =
    new IndexFlatIP(
      dimension,
    );


  const flatVectors =
    flattenVectors(
      chunkEmbeddings,
    );


  console.log(
    `[FAISS] Vector count: ${chunkEmbeddings.length}`,
  );


  console.log(
    `[FAISS] Flat vector length: ${flatVectors.length}`,
  );


  index.add(
    flatVectors,
  );


  /*
   * ----------------------------------------------------------
   * METRIC QUERIES
   * ----------------------------------------------------------
   */

  const metricQueries =
    getMetricQueries(
      documentType,
    );


  /*
   * ----------------------------------------------------------
   * COLLECT UNIQUE EVIDENCE
   * ----------------------------------------------------------
   *
   * Map key:
   *
   *     chunkIndex
   *
   * This is the important change.
   *
   * A PDF chunk is stored only once even if it matches
   * revenue, netProfit, operatingProfit, etc.
   * ----------------------------------------------------------
   */

  const selectedChunks =
    new Map();


  /*
   * ----------------------------------------------------------
   * SEARCH EACH METRIC
   * ----------------------------------------------------------
   */

  for (
    const [
      metric,
      query,
    ]
    of Object.entries(
      metricQueries,
    )
  ) {

    console.log(
      `[FAISS] Searching evidence for ${metric}: "${query.trim()}"`,
    );


    /*
     * Create query embedding.
     */

    const queryVector =
      await createEmbedding(
        embedder,
        query,
        `query ${metric}`,
      );


    /*
     * Validate query dimension.
     */

    if (
      queryVector.length !==
      dimension
    ) {

      throw new Error(
        `[FAISS] Query dimension mismatch for ${metric}. ` +
        `Expected ${dimension}, received ${queryVector.length}`,
      );

    }


    /*
     * Search only top 3 chunks.
     */

    const searchResult =
      index.search(
        queryVector,
        Math.min(
          TOP_K,
          chunks.length,
        ),
      );


    const distances =
      searchResult?.distances ||
      [];


    const labels =
      searchResult?.labels ||
      [];


    /*
     * --------------------------------------------------------
     * COLLECT MATCHES
     * --------------------------------------------------------
     */

    for (
      let i = 0;
      i < labels.length;
      i++
    ) {

      const chunkIndex =
        Number(
          labels[i],
        );


      if (
        !Number.isInteger(
          chunkIndex,
        ) ||
        chunkIndex < 0 ||
        chunkIndex >=
          chunks.length
      ) {

        continue;

      }


      const score =
        Number(
          distances[i] ??
            0,
        );


      if (
        !Number.isFinite(
          score,
        )
      ) {

        continue;

      }


      /*
       * Add semantic match and one neighbour on each side.
       */

      addChunkWithNeighbours(
        selectedChunks,
        chunks,
        chunkIndex,
        metric,
        score,
        NEIGHBOUR_DISTANCE,
      );

    }

  }

  /*
   * ----------------------------------------------------------
   * Metric-specific keyword scan: force-include chunks that
   * clearly look like the notes/tables for particular metrics.
   * This helps when vector search misses a note page entirely.
   * ----------------------------------------------------------
   */

  const metricNoteKeywords = {
    fixedAssets: /Note\s*12|Property\s*Plant|Property,\s*Plant|Fixed\s*Assets|Gross\s*Block|Net\s*Block|PPE/i,
    debtors: /Note\s*16|Trade\s*Receivables|Trade\s*Debtors|Debtors|Receivables|Accounts\s*Receivable|Sundry\s*Debtors?/i,
    creditors: /Note\s*9|Trade\s*Payables|Trade\s*Creditors|Creditors|Accounts\s*Payable|Sundry\s*Creditors?|Dues\s*of\s*Creditors?/i,
    borrowings: /Note\s*5|Note\s*8|Borrowings|Loans\s*and\s*Borrowings|Short-?term\s*Borrowings|Long-?term\s*Borrowings|Debt/i,
    cashAndBalance: /Note\s*17|Cash\s*and\s*cash\s*equivalents|Cash\s*&\s*Cash\s*Equivalents|Cash\s*and\s*Bank\s*Balances|Balances\s*with\s*Banks|Bank\s*Balances/i,
    rawMaterial: /Raw\s*Material|Raw\s*Materials|Raw\s*Material\s*Inventory/i,
    workInProgress: /Work\s*in\s*Progress|Work-?in-?Progress|WIP|Semi-?\s*Finished/i,
    finishedGoods: /Finished\s*Goods|Finished\s*Products|Finished\s*Goods\s*Inventory/i,
    financeCost: /Note\s*26|Finance\s*Costs|Interest\s*Expense|Borrowing\s*Costs|Finance\s*Charge/i,
    revenue: /Note\s*20|Revenue\s*from\s*Operations|Revenue|Total\s*Income|Sale\s*of\s*Products/i,
    operatingProfit: /Operating\s*Profit|Profit\s*from\s*Operations|EBIT|Profit\s*Before\s*Tax/i,
    netProfit: /Note\s*8|Profit\s*After\s*Tax|Profit\s*for\s*the\s*Year|Net\s*Profit|PAT/i,
  };

  for (const [metric, regex] of Object.entries(metricNoteKeywords)) {

    for (let i = 0; i < chunks.length; i++) {

      try {
        const text = (chunks[i] || "").toString();

        if (regex.test(text)) {

          // Force-add chunk with high semantic score and neighbours
          addChunkWithNeighbours(
            selectedChunks,
            chunks,
            i,
            metric,
            0.92,
            NEIGHBOUR_DISTANCE,
          );

        }

      } catch (e) {
        // ignore
      }

    }

  }


  /*
   * ----------------------------------------------------------
   * SORT UNIQUE EVIDENCE
   * ----------------------------------------------------------
   */

  let evidence =
    Array.from(
      selectedChunks.values(),
    )
      .sort(
        (
          a,
          b,
        ) => {

          /*
           * Primary:
           * semantic score.
           */

          if (
            b.score !==
            a.score
          ) {

            return (
              b.score -
              a.score
            );

          }


          /*
           * Secondary:
           * PDF position.
           */

          return (
            a.chunkIndex -
            b.chunkIndex
          );

        },
      );

  function isAuditorReportPage(text) {
    if (!text || typeof text !== "string") {
      return false;
    }

    return (
      /INDEPENDENT\s+AUDITOR(?:'S)?\s+REPORT/i.test(text) ||
      /WE\s+HAVE\s+AUDITED\s+THE\s+FINANCIAL\s+STATEMENTS/i.test(text) ||
      /RESPONSIBILITY\s+OF\s+THE\s+DIRECTORS/i.test(text) ||
      /REPORT\s+ON\s+THE\s+AUDIT\s+OF/i.test(text) ||
      /BASIS\s+FOR\s+OPINION/i.test(text) ||
      /EMPHASIS\s+OF\s+MATTER/i.test(text) ||
      /THE\s+ACCOMPANYING\s+FINANCIAL\s+STATEMENTS/i.test(text)
    );
  }

  /*
   * ----------------------------------------------------------
   * Force-include core Statement of Profit & Loss chunks.
   * Many metrics (revenue, netProfit, financeCost, operatingProfit)
   * are only present in the P&L. Detect P&L pages and ensure
   * their chunks are present in the evidence list (high score).
   * ----------------------------------------------------------
   */

  const mandatoryIndices = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const text = (chunks[i] || "").toString();

      const isPLHeader = /Statement\s*of\s*Profit\s*(and|&)?\s*Loss|Profit\s*and\s*Loss\s*Statement/i.test(text);
      const hasRevenue = /Revenue\s*from\s*Operations|Revenue|Total\s*Income/i.test(text);
      const hasProfit = /Profit\s*After\s*Tax|Profit\s*for\s*the\s*Year|Net\s*Profit|PAT|Profit\s*attributable\s*to\s*owners/i.test(text);

      if (isPLHeader && (hasRevenue || hasProfit)) {
        mandatoryIndices.push(i);
      }

    } catch (e) {
      // ignore parsing errors for chunk text
    }
  }

  const statementIndices = new Set();

  if (mandatoryIndices.length) {
    const existingIdxs = new Set(evidence.map((e) => e.chunkIndex));

    for (const idx of mandatoryIndices) {
      statementIndices.add(idx);

      if (existingIdxs.has(idx)) {
        const item = evidence.find((e) => e.chunkIndex === idx);
        if (item) item.score = Math.max(item.score, 0.95);
      } else {
        evidence.unshift({
          chunkIndex: idx,
          score: 0.995,
          metrics: new Set(["mandatory"]),
          text: chunks[idx],
        });
      }
    }
  }

  const balanceSheetIndices = [];

  function looksLikeBalanceSheet(text) {
    if (!text || typeof text !== "string") {
      return false;
    }

    const header = /\bBalance\s*Sheet\b|\bStatement\s*of\s*Financial\s*Position\b|\bStatement\s*of\s*Assets\s*and\s*Liabilities\b/i;
    const balanceLabels = /\bEQUITY\s+AND\s+LIABILITIES\b|\bTOTAL\s+ASSETS\b|\bTOTAL\s+LIABILITIES\b|\bCAPITAL\s+AND\s+RESERVES\b|\bSHAREHOLDERS'?S\s+FUNDS\b|\bCURRENT\s+ASSETS\b|\bNON-?CURRENT\s+LIABILITIES\b|\bTRADE\s*RECEIVABLES\b|\bTRADE\s*PAYABLES\b|\bCASH\s*&\s*CASH\s*EQUIVALENTS\b/i;
    const tableCues = /\bAS\s+AT\b|\bAS\s+ON\b|\bFOR\s+THE\s+YEAR\s+ENDED\b|\bMARCH\b|\bDECEMBER\b|\b31\s+MARCH\b|\b31\s+DECEMBER\b/i;
    const numbers = /\d[\d,]*\.?\d*/;

    return (
      (header.test(text) || balanceLabels.test(text)) &&
      (tableCues.test(text) || numbers.test(text))
    );
  }

  function looksLikeBalanceSheetTable(text) {
    if (!text || typeof text !== "string") {
      return false;
    }

    const balanceSheetItems = [
      /Trade\s*Receivables/i,
      /Trade\s*Payables/i,
      /Cash\s*&\s*Cash\s*Equivalents|Cash\s*and\s*Cash\s*Equivalents|Cash\s*and\s*Bank\s*Balances/i,
      /Property\s*,?\s*Plant\s*and\s*Equipment|Fixed\s*Assets|PPE/i,
      /Total\s+Equity\s+and\s+Liabilities|Total\s+Liabilities|Total\s+Assets/i,
      /Current\s*Assets|Non-?Current\s*Assets|Current\s*Liabilities|Non-?Current\s*Liabilities/i,
    ];

    const matches = balanceSheetItems.reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
    const hasNumbers = /\d[\d,]*\.?\d*/.test(text);

    return matches >= 2 && hasNumbers;
  }

  for (let i = 0; i < chunks.length; i++) {
    try {
      const text = (chunks[i] || "").toString();

      if (looksLikeBalanceSheet(text) || looksLikeBalanceSheetTable(text)) {
        balanceSheetIndices.push(i);
      }
    } catch (e) {
      // ignore
    }
  }

  for (const idx of balanceSheetIndices) {
    statementIndices.add(idx);
    const existingIdxs = new Set(evidence.map((e) => e.chunkIndex));
    if (!existingIdxs.has(idx)) {
      evidence.unshift({
        chunkIndex: idx,
        score: 0.995,
        metrics: new Set(["balanceSheet"]),
        text: chunks[idx],
      });
    }
  }

  evidence = evidence.filter((item) => {
    if (statementIndices.has(item.chunkIndex)) {
      return true;
    }

    return !isAuditorReportPage(item.text);
  });

  const selectedIndices = evidence.map((item) => item.chunkIndex);
  console.log(
    `[FAISS] Selected evidence chunk indices: ${selectedIndices.join(", ")}`,
  );

  /*
   * ----------------------------------------------------------
   * Boost table-like chunks slightly so they outrank generic
   * policy/definition pages with similar semantic scores.
   * This increases the chance that Balance Sheet / Note
   * tables appear in the final short context.
   * ----------------------------------------------------------
   */

  const tableHeaderPattern = /\b(As at|As on|For the year ended|For the period ended|March|December|Year ended|Rs\.|INR|₹|Rs|For the year)\b/i;

  for (const item of evidence) {

    try {
      if (tableHeaderPattern.test(item.text)) {
        item.score += 0.06;
      }
    } catch (e) {
      // ignore and continue
    }

  }

  // Re-sort after boosting
  evidence.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.chunkIndex - b.chunkIndex;
  });


  /*
   * ----------------------------------------------------------
   * LIMIT FINAL CONTEXT
   * (we will prioritize numeric chunks below before building)
   * ----------------------------------------------------------
   */

  console.log(
    `[FAISS] Unique candidate chunks: ${evidence.length}`,
  );

  /*
   * ----------------------------------------------------------
   * Prioritize chunks that contain numeric/table content.
   * Policy/definition pages often score highly semantically but
   * contain no numbers; prefer chunks with digits, currency
   * markers, or explicit note/year/table headers.
   * ----------------------------------------------------------
   */

  function isNumericChunk(text) {

    if (!text || typeof text !== "string") {
      return false;
    }

    // Look for numeric patterns, years, table headers, currency markers, or Note references
    const numberPattern = /\d[\d,]*\.\d{1,2}/; // e.g. 2,761.23 or 9.37
    const yearOrHeader = /\b(As at|As on|March|June|September|December|Year ended|Note)\b/i;
    const currency = /\b(Rs\.?|INR|₹|Lakhs|Crores)\b/i;

    return (
      numberPattern.test(text) ||
      (yearOrHeader.test(text) && /\d{4}/.test(text)) ||
      currency.test(text)
    );

  }

  const numericEvidence = evidence.filter((e) => isNumericChunk(e.text));
  const nonNumericEvidence = evidence.filter((e) => !isNumericChunk(e.text));

  // Prefer numeric chunks only. If none are found, fall back to non-numeric evidence.
  const finalEvidenceSource =
    numericEvidence.length > 0 ? numericEvidence : nonNumericEvidence;

  const {
    context,
    count,
    characters,
  } =
    buildLimitedContext(
      finalEvidenceSource,
    );

  console.log(
    `[FAISS] Selected ${count} evidence chunks for Groq.`,
  );

  console.log(
    `[FAISS] Relevant context length: ${characters}`,
  );

  console.log(
    `[FAISS] Maximum context length: ${MAX_CONTEXT_CHARS}`,
  );

  return context;
}