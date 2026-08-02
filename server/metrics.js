
/*
 * ============================================================
 * DASHBOARD METRICS
 * ============================================================
 *
 * This file is ONLY responsible for normalizing the structured
 * response returned by Groq.
 *
 * It does NOT:
 *
 * - extract PDF text
 * - retrieve PDF chunks
 * - call FAISS
 * - call embeddings
 * - call Groq
 * - calculate financial metrics
 * - infer missing values
 * - derive debtors from revenue
 * - derive creditors from expenses
 *
 * Every non-zero value must already come from the extraction
 * layer.
 * ============================================================
 */


/*
 * ============================================================
 * DEFAULT RESPONSE
 * ============================================================
 */

export const defaultExtractionResponse = {

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


/*
 * ============================================================
 * NORMALIZE NUMBER
 * ============================================================
 *
 * Converts a value returned by Groq into a safe JavaScript
 * number.
 *
 * Supported:
 *
 *   21167.24
 *   "21167.24"
 *   "21,167.24"
 *   "₹ 21,167.24"
 *   "(125.50)"
 *
 * Parentheses represent negative values.
 *
 * IMPORTANT:
 *
 * This function NEVER calculates or derives values.
 * ============================================================
 */

export function normalizeNumber(
  value,
) {

  /*
   * ----------------------------------------------------------
   * Missing value
   * ----------------------------------------------------------
   */

  if (
    value === null ||
    value === undefined
  ) {

    return 0;

  }


  /*
   * ----------------------------------------------------------
   * Number
   * ----------------------------------------------------------
   */

  if (
    typeof value ===
    "number"
  ) {

    if (
      !Number.isFinite(
        value,
      )
    ) {

      return 0;

    }


    return value;

  }


  /*
   * ----------------------------------------------------------
   * String
   * ----------------------------------------------------------
   */

  if (
    typeof value !==
    "string"
  ) {

    return 0;

  }


  let cleaned =
    value.trim();


  if (!cleaned) {

    return 0;

  }


  /*
   * ----------------------------------------------------------
   * Accounting negative
   *
   * Example:
   *
   * (125.50)
   * ----------------------------------------------------------
   */

  const negative =
    cleaned.startsWith(
      "(",
    ) &&
    cleaned.endsWith(
      ")",
    );


  /*
   * Remove supported formatting.
   */

  cleaned =
    cleaned
      .replace(
        /₹/g,
        "",
      )
      .replace(
        /Rs\.?/gi,
        "",
      )
      .replace(
        /INR/gi,
        "",
      )
      .replace(
        /,/g,
        "",
      )
      .replace(
        /\s/g,
        "",
      )
      .replace(
        /[()]/g,
        "",
      )
      .trim();


  if (!cleaned) {

    return 0;

  }


  /*
   * ----------------------------------------------------------
   * Reject percentages.
   *
   * Example:
   *
   * "12.5%"
   *
   * is NOT a financial amount.
   * ----------------------------------------------------------
   */

  if (
    cleaned.includes(
      "%",
    )
  ) {

    return 0;

  }


  /*
   * ----------------------------------------------------------
   * Reject strings containing unexpected characters.
   *
   * Valid:
   *
   *   1250
   *   1250.50
   *   -1250.50
   *
   * Invalid:
   *
   *   1250 crore
   *   approximately 1250
   *   1250 million
   * ----------------------------------------------------------
   */

  if (
    !/^-?\d+(?:\.\d+)?$/.test(
      cleaned,
    )
  ) {

    return 0;

  }


  const number =
    Number(
      cleaned,
    );


  if (
    !Number.isFinite(
      number,
    )
  ) {

    return 0;

  }


  return negative
    ? -Math.abs(number)
    : number;
}


/*
 * ============================================================
 * NORMALIZE EXTRACTION
 * ============================================================
 *
 * Takes the structured JSON returned by Groq and guarantees
 * that the API returns exactly the dashboard metric schema.
 *
 * IMPORTANT:
 *
 * There is NO fallback calculation here.
 *
 * Missing metric:
 *
 *   -> 0
 *
 * Invalid metric:
 *
 *   -> 0
 *
 * Valid extracted metric:
 *
 *   -> unchanged numeric value
 * ============================================================
 */

export function normalizeExtraction(
  payload,
) {

  const normalized = {
    ...defaultExtractionResponse,
  };


  /*
   * Invalid Groq response.
   */

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {

    return normalized;

  }


  /*
   * Normalize only known dashboard fields.
   */

  Object.keys(
    defaultExtractionResponse,
  ).forEach(
    (key) => {

      normalized[key] =
        normalizeNumber(
          payload[key],
        );

    },
  );


  return normalized;
}

