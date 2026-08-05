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
  chunkSize = 2000,
  overlap = 400,
) {

  if (!text) {
    return [];
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

  const blocks = text
    .split(/\f|\n{2,}/g)
    .map(
      (block) =>
        block.trim(),
    )
    .filter(
      Boolean,
    );

  const chunks = [];
  let current = "";

  for (
    const block of blocks
  ) {

    if (!current) {
      current = block;
      continue;
    }

    if (
      block.length > chunkSize
    ) {
      if (current) {
        chunks.push(
          current.trim(),
        );
        current = "";
      }

      let start = 0;

      while (
        start < block.length
      ) {

        const end =
          Math.min(
            start + chunkSize,
            block.length,
          );

        const piece =
          block
            .slice(
              start,
              end,
            )
            .trim();

        if (piece) {
          chunks.push(
            piece,
          );
        }

        if (
          end >= block.length
        ) {
          break;
        }

        start =
          end -
          Math.min(
            overlap,
            end - start,
          );
      }

      continue;
    }

    const candidate =
      `${current}\n\n${block}`;

    if (
      candidate.length <=
      chunkSize
    ) {
      current = candidate;
      continue;
    }

    chunks.push(
      current.trim(),
    );
    current = block;
  }

  if (current) {
    chunks.push(
      current.trim(),
    );
  }

  if (
    overlap > 0 &&
    chunks.length > 1
  ) {
    const overlapped = [];

    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {
      if (i === 0) {
        overlapped.push(
          chunks[i],
        );
        continue;
      }

      const previous =
        chunks[i - 1];

      const tail =
        previous.slice(
          -Math.min(
            overlap,
            previous.length,
          ),
        );

      overlapped.push(
        `${tail}\n\n${chunks[i]}`,
      );
    }

    return overlapped;
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