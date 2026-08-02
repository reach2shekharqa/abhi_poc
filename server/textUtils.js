/*
 * ============================================================
 * TEXT CLEANING
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


/*
 * ============================================================
 * TEXT CHUNKING
 * ============================================================
 */

export function chunkText(
  text,
  chunkSize = 1200,
  overlap = 200,
) {

  const chunks = [];

  if (!text) {
    return chunks;
  }

  if (
    chunkSize <= 0
  ) {

    throw new Error(
      "chunkSize must be greater than zero.",
    );
  }

  if (
    overlap < 0 ||
    overlap >= chunkSize
  ) {

    throw new Error(
      "overlap must be >= 0 and smaller than chunkSize.",
    );
  }

  let start = 0;

  while (
    start < text.length
  ) {

    const end =
      Math.min(
        start + chunkSize,
        text.length,
      );

    const chunk =
      text
        .slice(
          start,
          end,
        )
        .trim();

    if (chunk) {
      chunks.push(
        chunk,
      );
    }

    if (
      end >= text.length
    ) {
      break;
    }

    start =
      end - overlap;
  }

  return chunks;
}


/*
 * ============================================================
 * NORMALIZE WHITESPACE
 * ============================================================
 */

export function normalizeWhitespace(
  text,
) {

  if (!text) {
    return "";
  }

  return text
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