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

const TOP_K = 2;

const NEIGHBOUR_DISTANCE = 1;

const MAX_EVIDENCE_CHUNKS = 18;

const MAX_CONTEXT_CHARS = 18000;


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
}) {

  if (!cleanedText) {

    return "";

  }


  /*
   * ----------------------------------------------------------
   * CHUNK PDF
   * ----------------------------------------------------------
   */

  const chunks =
    chunkText(
      cleanedText,
      1200,
      200,
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
   * SORT UNIQUE EVIDENCE
   * ----------------------------------------------------------
   */

  const evidence =
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


  /*
   * ----------------------------------------------------------
   * LIMIT FINAL CONTEXT
   * ----------------------------------------------------------
   */

  const {
    context,
    count,
    characters,
  } =
    buildLimitedContext(
      evidence,
    );


  console.log(
    `[FAISS] Unique candidate chunks: ${evidence.length}`,
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