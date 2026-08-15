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
    model = (typeof process !== 'undefined' && process.env?.GEMINI_MODEL) || 'gemini-2.0-flash-lite'
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
