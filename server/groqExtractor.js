import {
  groqApiKey,
  groqModel,
} from "./config.js";

import {
  buildExtractionPrompt,
} from "./prompts.js";


/*
 * ============================================================
 * SANITIZE GROQ RESPONSE
 * ============================================================
 *
 * Groq should return JSON because response_format is set to
 * json_object.
 *
 * This sanitizer is still kept as a safety layer in case the
 * model returns markdown fences or surrounding text.
 * ============================================================
 */

function sanitizeJson(
  rawText,
) {

  if (
    !rawText ||
    typeof rawText !==
      "string"
  ) {

    return "{}";

  }


  const cleaned =
    rawText
      .replace(
        /```json/gi,
        "",
      )
      .replace(
        /```/g,
        "",
      )
      .trim();


  const firstBrace =
    cleaned.indexOf(
      "{",
    );


  const lastBrace =
    cleaned.lastIndexOf(
      "}",
    );


  if (
    firstBrace >= 0 &&
    lastBrace >
      firstBrace
  ) {

    return cleaned.slice(
      firstBrace,
      lastBrace + 1,
    );

  }


  return cleaned;
}


/*
 * ============================================================
 * GROQ EXTRACTION
 * ============================================================
 *
 * IMPORTANT:
 *
 * The complete PDF is NOT sent to Groq.
 *
 * Only:
 *
 * relevantContext
 *
 * is sent.
 *
 * Pipeline:
 *
 * PDF
 *  ↓
 * local extraction
 *  ↓
 * local embeddings
 *  ↓
 * FAISS
 *  ↓
 * relevantContext
 *  ↓
 * Groq
 *  ↓
 * structured metrics
 * ============================================================
 */

export async function extractWithGroq({
  documentType,
  relevantContext,
  reportingUnit,
}) {

  if (!groqApiKey) {

    throw new Error(
      "Missing GROQ_API_KEY environment variable.",
    );

  }


  if (!relevantContext) {

    throw new Error(
      "No relevant PDF evidence was supplied to Groq.",
    );

  }


  /*
   * ----------------------------------------------------------
   * SYSTEM PROMPT
   * ----------------------------------------------------------
   */

  const systemPrompt =
    buildExtractionPrompt(
      documentType,
      reportingUnit,
    );


  /*
   * ----------------------------------------------------------
   * USER CONTENT
   * ----------------------------------------------------------
   */

  const userContent = `
DOCUMENT TYPE:
${documentType}

REPORTING UNIT:
${reportingUnit}

RELEVANT PDF EVIDENCE:
${relevantContext}
`;


  console.log(
    "[Groq] Sending relevant financial evidence...",
  );


  console.log(
    "[Groq] Context length:",
    relevantContext.length,
  );


  /*
   * ----------------------------------------------------------
   * GROQ REQUEST
   * ----------------------------------------------------------
   */

  const response =
    await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${groqApiKey}`,
        },

        body:
          JSON.stringify({
            model:
              groqModel,

            temperature:
              0,

            response_format: {
              type:
                "json_object",
            },

            messages: [

              {
                role:
                  "system",

                content:
                  systemPrompt,
              },

              {
                role:
                  "user",

                content:
                  userContent,
              },

            ],
          }),
      },
    );


  /*
   * ----------------------------------------------------------
   * HANDLE GROQ ERROR
   * ----------------------------------------------------------
   */

  if (!response.ok) {

    const errorPayload =
      await response.text();


    throw new Error(
      `Groq request failed: ${response.status} ${errorPayload}`,
    );

  }


  /*
   * ----------------------------------------------------------
   * PARSE RESPONSE
   * ----------------------------------------------------------
   */

  const data =
    await response.json();


  const content =
    data
      ?.choices?.[0]
      ?.message
      ?.content ??
    "{}";


  console.log(
    "\n========================================",
  );


  console.log(
    "GROQ RAW RESPONSE:",
  );


  console.log(
    content,
  );


  console.log(
    "========================================",
  );


  /*
   * ----------------------------------------------------------
   * JSON PARSING
   * ----------------------------------------------------------
   */

  let parsedJson = {};


  try {

    parsedJson =
      JSON.parse(
        sanitizeJson(
          content,
        ),
      );

  } catch (error) {

    console.error(
      "[Groq] Could not parse JSON response:",
      error,
    );


    /*
     * Do not crash the complete application because
     * Groq returned malformed JSON.
     *
     * The normalization layer will convert this to
     * the dashboard's default zero values.
     */

    parsedJson = {};

  }


  return parsedJson;
}