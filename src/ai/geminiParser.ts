/**
 * Generic Gemini Multimodal Document Parser Utility
 * 
 * Can be imported in backend / Cloud Functions (or environment with fetch / Node.js)
 * to parse PDFs, images, or documents with custom prompts and JSON schemas.
 */

export interface GeminiDocumentParserOptions {
  /** API key for Google Gemini */
  apiKey: string;
  /** Base64 string or Uint8Array/Buffer of the PDF or image file */
  fileBuffer: string | Uint8Array;
  /** MIME type of the file. Defaults to 'application/pdf' */
  mimeType?: string;
  /** Custom prompt specifying instructions for extraction */
  prompt: string;
  /** Optional JSON Schema for Gemini Structured Output (responseSchema) */
  jsonSchema?: Record<string, any>;
  /** Model identifier. Defaults to 'gemini-2.0-flash' */
  model?: string;
}

/**
 * Standard prompt template for Proforma Disbursement Account (PDA) extraction
 */
export const PDA_EXTRACTION_PROMPT = `
You are an expert maritime shipping assistant. Analyze the attached Proforma Disbursement Account (PDA) PDF document.
Extract all key vessel and financial data into a clean JSON structure matching the requested schema.
Be exact with monetary figures, currency amounts, vessel names, ports, and line item concepts.
`.trim();

/**
 * Standard JSON Schema definition for PDA extraction
 */
export const PDA_JSON_SCHEMA = {
  type: 'object',
  properties: {
    vessel: { type: 'string', description: 'Name of the vessel' },
    imo: { type: 'string', description: 'IMO number if present' },
    subagent: { type: 'string', description: 'Local agent or subagent issuing the PDA' },
    port: { type: 'string', description: 'Port name' },
    product: { type: 'string', description: 'Cargo / Product type' },
    quantity: { type: 'string', description: 'Cargo quantity with units' },
    eta: { type: 'string', description: 'ETA timestamp or date string' },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: 'Expense item concept name' },
          amount: { type: 'number', description: 'Expense amount in USD' }
        },
        required: ['concept', 'amount']
      }
    },
    totalPda: { type: 'number', description: 'Grand total amount in USD' }
  },
  required: ['vessel', 'port', 'lineItems', 'totalPda']
};

/**
 * Executes a structured document extraction request using the Gemini REST API.
 * Designed to be called inside Cloud Functions or backend services.
 */
export async function parseDocumentWithGemini<T = Record<string, any>>(
  options: GeminiDocumentParserOptions
): Promise<T> {
  const {
    apiKey,
    fileBuffer,
    mimeType = 'application/pdf',
    prompt,
    jsonSchema,
    model = 'gemini-1.5-flash'
  } = options;

  let base64Data: string;
  if (typeof fileBuffer === 'string') {
    base64Data = fileBuffer;
  } else {
    // Convert Uint8Array/Buffer to base64
    let binary = '';
    const bytes = new Uint8Array(fileBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: any = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      ...(jsonSchema ? { responseSchema: jsonSchema } : {})
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(rawText) as T;
}
