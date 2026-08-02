/*
 * ============================================================
 * REPORTING UNIT DETECTION
 * ============================================================
 *
 * Detects the unit used by the financial document.
 *
 * Examples:
 *
 * Figures in Lakhs
 * Figures in Crores
 * Amount in Millions
 * Amount in Thousands
 *
 * The detected unit is returned as metadata.
 *
 * IMPORTANT:
 * We do NOT convert the values here.
 *
 * If the PDF reports:
 *
 * Revenue = 21167.24
 * Figures in Lakhs
 *
 * the extracted value remains:
 *
 * 21167.24
 *
 * Unit:
 * Lakhs
 *
 * ============================================================
 */

export function detectReportingUnit(
  text,
) {

  if (!text) {
    return "Unknown";
  }


  const normalized =
    text.toLowerCase();


  /*
   * ----------------------------------------------------------
   * LAKHS
   * ----------------------------------------------------------
   */

  if (
    normalized.includes(
      "figures in lakhs",
    ) ||
    normalized.includes(
      "figure in lakhs",
    ) ||
    normalized.includes(
      "amount in lakhs",
    ) ||
    normalized.includes(
      "amounts in lakhs",
    ) ||
    normalized.includes(
      "rs. in lakhs",
    ) ||
    normalized.includes(
      "rs in lakhs",
    ) ||
    normalized.includes(
      "₹ in lakhs",
    ) ||
    normalized.includes(
      "in lakhs",
    )
  ) {

    return "Lakhs";
  }


  /*
   * ----------------------------------------------------------
   * CRORES
   * ----------------------------------------------------------
   */

  if (
    normalized.includes(
      "figures in crores",
    ) ||
    normalized.includes(
      "figure in crores",
    ) ||
    normalized.includes(
      "amount in crores",
    ) ||
    normalized.includes(
      "amounts in crores",
    ) ||
    normalized.includes(
      "rs. in crores",
    ) ||
    normalized.includes(
      "rs in crores",
    ) ||
    normalized.includes(
      "₹ in crores",
    ) ||
    normalized.includes(
      "in crores",
    )
  ) {

    return "Crores";
  }


  /*
   * ----------------------------------------------------------
   * MILLIONS
   * ----------------------------------------------------------
   */

  if (
    normalized.includes(
      "figures in millions",
    ) ||
    normalized.includes(
      "figure in millions",
    ) ||
    normalized.includes(
      "amount in millions",
    ) ||
    normalized.includes(
      "amounts in millions",
    ) ||
    normalized.includes(
      "in millions",
    )
  ) {

    return "Millions";
  }


  /*
   * ----------------------------------------------------------
   * THOUSANDS
   * ----------------------------------------------------------
   */

  if (
    normalized.includes(
      "figures in thousands",
    ) ||
    normalized.includes(
      "figure in thousands",
    ) ||
    normalized.includes(
      "amount in thousands",
    ) ||
    normalized.includes(
      "amounts in thousands",
    ) ||
    normalized.includes(
      "in thousands",
    )
  ) {

    return "Thousands";
  }


  /*
   * ----------------------------------------------------------
   * UNKNOWN
   * ----------------------------------------------------------
   */

  return "Unknown";
}