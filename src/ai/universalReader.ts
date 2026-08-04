/**
 * Generalized Universal Input Pool & Document Reader (Pool de Entrada Universal)
 * 
 * Domain-agnostic AI classification & multi-turn structured extraction utility.
 * Instantiable class: configure API key OR backend Cloud Function URL in constructor.
 * Keeping API keys secure on server side (Cloud Functions) is fully supported via functionUrl.
 */

export interface ClassificationDestination {
  id: string;
  name: string;
  description: string;
}

export type ExtractedMetadata = Record<string, any>;

export interface ClassificationResult {
  destinationId: string;
  destinationName: string;
  confidence: number;
  reasoning: string;
  classificationNote?: string;
  caseMetadata?: ExtractedMetadata;
}

export interface MatchEntityProposal<T = any> {
  entityId: string;
  entityData: T;
  caseId?: string;
  caseData?: T;
  matchScore: number; // 0.0 to 1.0
  matchReasons: string[];
  formattedLabel: string;
}

export type CaseProposal<T = any> = MatchEntityProposal<T>;

export interface GenericExtractionSchema {
  id: string;
  name: string;
  jsonSchema: Record<string, any>;
  promptInstructions?: string;
}

export interface UniversalReaderDebugInfo {
  timestamp: string;
  modeUsed: 'cloud_function' | 'direct_gemini_api' | 'mock_fallback';
  functionUrl?: string;
  hasApiKey: boolean;
  promptSent: string;
  hasFileBase64: boolean;
  fileBase64Length: number;
  mimeType: string;
  fileName: string;
  rawResponseText?: string;
  errorDetails?: string;
}

export interface UniversalReaderConfig {
  /** Backend Cloud Function / Proxy URL to keep API keys secure on server */
  functionUrl?: string;
  /** Gemini API Key (Optional if using functionUrl) */
  apiKey?: string;
  /** Gemini model identifier. Defaults to 'gemini-1.5-flash' */
  modelName?: string;
  /** Custom system role description */
  systemRole?: string;
  /** Optional default list of metadata fields to extract in Step 1 */
  metadataFields?: string[];
  /** Default field weights for entity matching */
  fieldWeights?: Record<string, number>;
  /** Default candidate destinations list */
  destinations?: ClassificationDestination[];
  /** Default extraction schemas map */
  schemas?: Record<string, GenericExtractionSchema | Record<string, any>>;
}

export interface UniversalReaderProcessOptions {
  /** File as Base64 string OR browser File object */
  file?: File | string;
  /** Base64 string if file is already base64 */
  fileBase64?: string;
  /** MIME type of file (e.g. 'application/pdf', 'image/png') */
  mimeType?: string;
  /** Plain text content if reading raw text file or email */
  textContent?: string;
  /** Original file name for logging / heuristics */
  fileName?: string;
  /** Optional operator notes or extra user context */
  additionalContext?: string;
  /** Custom override candidate destinations list */
  destinations?: ClassificationDestination[];
  /** Custom override extraction schemas map */
  schemas?: Record<string, GenericExtractionSchema | Record<string, any>>;
  /** Active entities/cases list to match against */
  casesList?: any[];
  /** Custom override field weights for matching algorithm */
  fieldWeights?: Record<string, number>;
}

export interface UniversalReaderResult<T = Record<string, any>, C = any> {
  classification: ClassificationResult;
  extractedData: T;
  schemaUsed?: GenericExtractionSchema;
  caseProposals?: MatchEntityProposal<C>[];
  suggestedCase?: MatchEntityProposal<C>;
  debugInfo?: UniversalReaderDebugInfo;
}

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  for (let i = 0; i <= lenB; i++) matrix[i] = [i];
  for (let j = 0; j <= lenA; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenB; i++) {
    for (let j = 1; j <= lenA; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[lenB][lenA];
}

/**
 * Calculates Levenshtein similarity score between 0.0 (no match) and 1.0 (exact match)
 */
export function levenshteinSimilarity(str1?: string, str2?: string): number {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const s2 = String(str2).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1.0 : Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * Helper to convert browser File object to Base64 string
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      resolve({
        base64,
        mimeType: file.type || 'application/pdf',
        fileName: file.name
      });
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Generic Firebase Cloud Function / Express Request Handler for Universal Reader Proxy.
 * Can be exported and mounted directly in any Firebase Cloud Functions or Express app:
 * 
 * export const universalReaderProcess = onRequest({ cors: true }, (req, res) => handleUniversalReaderRequest(req, res));
 */
export async function handleUniversalReaderRequest(
  req: any,
  res: any,
  options: { apiKey?: string; defaultModel?: string } = {}
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured on server.' });
      return;
    }

    const { contents, generationConfig, modelName } = req.body;
    if (!contents || !Array.isArray(contents)) {
      res.status(400).json({ error: 'Invalid contents array payload' });
      return;
    }

    const selectedModel = modelName || options.defaultModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: generationConfig || { responseMimeType: 'application/json' }
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      res.status(apiResponse.status).json({ error: `Gemini API Error [${apiResponse.status}]: ${errText}` });
      return;
    }

    const data = await apiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.status(200).json({
      success: true,
      modelUsed: selectedModel,
      rawText
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Universal Reader backend process error' });
  }
}

/**
 * Normalizes destinations parameter: accepts arrays or wrapper JSON objects ({ document_destinations: [...] } or { destinations: [...] })
 */
export function normalizeDestinations(input?: any): ClassificationDestination[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.document_destinations)) return input.document_destinations;
  if (Array.isArray(input.destinations)) return input.destinations;
  return [];
}

/**
 * Normalizes schemas parameter: accepts schema maps or wrapper JSON objects ({ schemas: { ... } })
 */
export function normalizeSchemas(input?: any): Record<string, GenericExtractionSchema | Record<string, any>> {
  if (!input) return {};
  if (input.schemas && typeof input.schemas === 'object' && !('type' in input.schemas)) {
    return input.schemas;
  }
  return input;
}

/**
 * Instantiable Universal Reader Engine
 * Supports execution via secure Cloud Function proxy (functionUrl) OR direct API Key.
 */
export class UniversalReaderEngine {
  private functionUrl?: string;
  private apiKey?: string;
  private modelName: string;
  private systemRole: string;
  private metadataFields: string[];
  private fieldWeights: Record<string, number>;
  private destinations: ClassificationDestination[];
  private schemas: Record<string, GenericExtractionSchema | Record<string, any>>;

  constructor(config: UniversalReaderConfig = {}) {
    this.functionUrl = config.functionUrl;
    this.apiKey = config.apiKey || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : undefined);
    this.modelName = config.modelName || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_MODEL : undefined) || 'gemini-2.0-flash';
    this.systemRole = config.systemRole || 'You are an expert AI document classifier and entity extractor.';
    this.metadataFields = config.metadataFields || [];
    this.fieldWeights = config.fieldWeights || {};
    this.destinations = normalizeDestinations(config.destinations);
    this.schemas = normalizeSchemas(config.schemas);
  }

  /**
   * Executive helper to call LLM either via backend Cloud Function proxy or direct Gemini REST API (with automatic fallback)
   */
  private async executeLlmCall(
    contents: any[],
    responseSchema?: Record<string, any>
  ): Promise<{ rawText: string; modeUsed: 'cloud_function' | 'direct_gemini_api'; errorDetails?: string }> {
    let lastErrMessage = '';

    // Mode A: Try Secure Cloud Function Proxy first
    if (this.functionUrl) {
      try {
        const response = await fetch(this.functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            modelName: this.modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              ...(responseSchema ? { responseSchema } : {})
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.rawText) {
            return { rawText: data.rawText, modeUsed: 'cloud_function' };
          }
          if (data.extractedData) {
            return { rawText: JSON.stringify(data.extractedData), modeUsed: 'cloud_function' };
          }
        } else {
          const errBody = await response.text();
          lastErrMessage = `Cloud Function HTTP [${response.status}]: ${errBody}`;
          console.warn('Universal Reader Cloud Function call failed, trying direct Gemini API fallback if key available:', lastErrMessage);
        }
      } catch (cfErr: any) {
        lastErrMessage = `Cloud Function Network/CORS Error: ${cfErr?.message || cfErr}`;
        console.warn('Universal Reader Cloud Function fetch exception:', lastErrMessage);
      }
    }

    // Mode B: Direct Gemini REST API (Server side or Dev with API key fallback)
    const effectiveApiKey = this.apiKey || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : undefined);

    if (effectiveApiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${effectiveApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            ...(responseSchema ? { responseSchema } : {})
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API HTTP error [${response.status}]: ${errText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned an empty response text.');
      }
      return { rawText, modeUsed: 'direct_gemini_api' };
    }

    throw new Error(lastErrMessage || 'No valid API key or reachable Cloud Function URL configured.');
  }

  /**
   * Domain-agnostic prompt builder for document classification & metadata extraction
   */
  public buildClassificationPrompt(
    destinations: ClassificationDestination[] = this.destinations,
    systemRole = this.systemRole,
    metadataFields: string[] = this.metadataFields
  ): string {
    const candidateList = destinations.length > 0 ? destinations : this.destinations;
    const hasOther = candidateList.some(d => d.id === 'other');
    const fullDestinations = hasOther
      ? candidateList
      : [
          ...candidateList,
          {
            id: 'other',
            name: 'Other / Unclassified Document',
            description: 'Any document that does not fit into the available categories above.'
          }
        ];

    const formattedList = fullDestinations
      .map(d => `- ID: "${d.id}" | Name: "${d.name}" | Description: ${d.description}`)
      .join('\n');

    const metadataFieldsSchema = metadataFields.length > 0
      ? metadataFields.map(f => `    "${f}": "string or null"`).join(',\n')
      : '    // Any key entity fields detected in header/text';

    const metadataRule = metadataFields.length > 0
      ? `Extract any visible entity parameters from header/text: ${metadataFields.join(', ')}.`
      : 'Extract any key entity parameters visible in the document.';

    return `
${systemRole}
Your task is to analyze the provided document (PDF, image, or text) and perform TWO tasks:

1. CLASSIFICATION: Classify the document into PRECISELY ONE destination from the list below.
2. METADATA EXTRACTION: ${metadataRule}

CANDIDATE DESTINATIONS:
${formattedList}

CRITICAL RULES:
1. Examine document headers, titles, structure, terminology, and purpose.
2. Provide a clear, human-readable 1-2 sentence note explaining WHY you believe the document belongs to this destination type (mentioning specific keywords, title headers, or structure detected).
3. If the document does NOT clearly match any specialized destination above, classify it as "other".
4. Return ONLY pure raw JSON matching this structure:
{
  "destinationId": "string (MUST be one of the destination IDs above)",
  "destinationName": "string",
  "confidence": number (between 0.0 and 1.0),
  "reasoning": "string (Brief explanation in English of why this document matches this destination)",
  "classificationNote": "string (A clear, user-facing explanation note in English of why the document is classified as this type)",
  "caseMetadata": {
${metadataFieldsSchema}
  }
}
`.trim();
  }

  /**
   * Helper to normalize file input (Base64 string or browser File object)
   */
  private async resolveFileInput(options: UniversalReaderProcessOptions): Promise<{
    base64Data?: string;
    mimeType: string;
    fileName: string;
  }> {
    let base64Data = options.fileBase64;
    let mimeType = options.mimeType || 'application/pdf';
    let fileName = options.fileName || 'document.pdf';

    if (options.file) {
      if (typeof options.file === 'string') {
        base64Data = options.file;
      } else if (options.file instanceof File) {
        const resolved = await fileToBase64(options.file);
        base64Data = resolved.base64;
        mimeType = resolved.mimeType;
        fileName = resolved.fileName;
      }
    }

    return { base64Data, mimeType, fileName };
  }

  /**
   * Step 1: Classify document and extract generic metadata
   */
  public async classifyDocument(options: UniversalReaderProcessOptions = {}): Promise<ClassificationResult> {
    const destinations = options.destinations || this.destinations;
    const { base64Data, mimeType, fileName } = await this.resolveFileInput(options);

    const effectiveApiKey = this.apiKey || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : undefined);

    if (!effectiveApiKey && !this.functionUrl) {
      return this.fallbackMockClassification(fileName, destinations);
    }

    try {
      const systemPrompt = this.buildClassificationPrompt(
        destinations,
        this.systemRole,
        options.fieldWeights ? Object.keys(options.fieldWeights) : this.metadataFields
      );

      const parts: any[] = [{ text: systemPrompt }];

      if (options.additionalContext) {
        parts.push({ text: `Additional User Context: ${options.additionalContext}` });
      }

      if (options.textContent) {
        parts.push({ text: `Document Content:\n${options.textContent}` });
      }

      if (base64Data) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const { rawText } = await this.executeLlmCall([{ parts }]);
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);

      return {
        destinationId: parsed.destinationId || 'other',
        destinationName: parsed.destinationName || 'Other / Unclassified Document',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
        reasoning: parsed.reasoning || 'Classified based on document content.',
        classificationNote: parsed.classificationNote || parsed.reasoning || 'Document analyzed and classified based on header terms and layout structure.',
        caseMetadata: parsed.caseMetadata || {}
      };
    } catch (err) {
      console.warn('Universal Reader classification error, using fallback:', err);
      return this.fallbackMockClassification(fileName, destinations);
    }
  }

  /**
   * Generic Entity/Case Matching & Dropdown Probability Ranking Engine
   */
  public matchAndRankCases<T = any>(
    extractedMeta?: ExtractedMetadata,
    casesList: T[] = [],
    customWeights?: Record<string, number>
  ): MatchEntityProposal<T>[] {
    if (!casesList || casesList.length === 0) return [];

    const meta = extractedMeta || {};
    const defaultWeights: Record<string, number> = customWeights || this.fieldWeights || {};

    const activeFields = Object.keys(meta).filter(k => meta[k] != null && String(meta[k]).trim() !== '');
    const hasAnyQuery = activeFields.length > 0;

    const proposals: MatchEntityProposal<T>[] = casesList.map((cItem: any) => {
      let totalScore = 0;
      let maxPossibleScore = 0;
      const reasons: string[] = [];

      const entityId = cItem.id || cItem.caseId || cItem.code || 'ENTITY';

      for (const field of activeFields) {
        const queryVal = meta[field];
        const itemVal = cItem[field];
        const weight = defaultWeights[field] || 10;

        if (queryVal && itemVal) {
          maxPossibleScore += weight;
          const sim = levenshteinSimilarity(String(queryVal), String(itemVal));
          if (sim > 0.4) {
            totalScore += sim * weight;
            const matchType = sim > 0.95 ? 'Exact' : `${Math.round(sim * 100)}% Levenshtein`;
            reasons.push(`${field} Match (${matchType}): ${itemVal}`);
          }
        }
      }

      const matchRatio = maxPossibleScore > 0 ? Math.min(1.0, totalScore / maxPossibleScore) : 0;
      const pct = Math.round(matchRatio * 100);

      const titleDisplay = cItem.vessel || cItem.name || cItem.title || cItem.label || entityId;
      const subDisplay = cItem.port || cItem.category || cItem.type ? ` (${cItem.port || cItem.category || cItem.type})` : '';
      const clientDisplay = cItem.client || cItem.owner || cItem.user ? ` — ${cItem.client || cItem.owner || cItem.user}` : '';

      const label = hasAnyQuery && pct > 0
        ? `[${pct}% Match] ${entityId} — ${titleDisplay}${subDisplay}${clientDisplay}`
        : `${entityId} — ${titleDisplay}${subDisplay}${clientDisplay}`;

      return {
        entityId,
        entityData: cItem,
        caseId: entityId,
        caseData: cItem,
        matchScore: hasAnyQuery ? matchRatio : 0,
        matchReasons: reasons,
        formattedLabel: label
      };
    });

    const maxScoreFound = Math.max(...proposals.map(p => p.matchScore));

    if (hasAnyQuery && maxScoreFound > 0) {
      proposals.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      proposals.sort((a, b) => {
        const itemA = a.entityData as any;
        const itemB = b.entityData as any;
        const dateA = new Date(itemA?.eta || itemA?.date || itemA?.createdAt || '2000-01-01').getTime();
        const dateB = new Date(itemB?.eta || itemB?.date || itemB?.createdAt || '2000-01-01').getTime();
        return dateB - dateA;
      });
    }

    return proposals;
  }

  /**
   * Two-Turn Pipeline with Entity Proposal Ranking:
   * Turn 1: Classify document & extract metadata
   * Turn 2: Extract structured JSON fields using session history
   * Turn 3: Rank active entities/cases by Levenshtein match score probability (or descending date fallback)
   */
  public async processUniversalPool<T = Record<string, any>, C = any>(
    options: UniversalReaderProcessOptions = {}
  ): Promise<UniversalReaderResult<T, C>> {
    const destinations = options.destinations || this.destinations;
    const schemas = options.schemas || this.schemas;
    const casesList = options.casesList || [];
    const weights = options.fieldWeights || this.fieldWeights;

    const { base64Data, mimeType, fileName } = await this.resolveFileInput(options);

    const effectiveApiKey = this.apiKey || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : undefined);

    let debugInfo: UniversalReaderDebugInfo = {
      timestamp: new Date().toISOString(),
      modeUsed: 'mock_fallback',
      functionUrl: this.functionUrl,
      hasApiKey: Boolean(effectiveApiKey),
      promptSent: '',
      hasFileBase64: Boolean(base64Data),
      fileBase64Length: base64Data ? base64Data.length : 0,
      mimeType,
      fileName
    };

    if (!effectiveApiKey && !this.functionUrl) {
      const mockClass = this.fallbackMockClassification(fileName, destinations);
      const caseProposals = this.matchAndRankCases<C>(mockClass.caseMetadata, casesList, weights);
      return {
        classification: mockClass,
        extractedData: { mock: true, note: 'No API key or Cloud Function configured. Sample extraction data.' } as unknown as T,
        caseProposals,
        suggestedCase: caseProposals[0],
        debugInfo: { ...debugInfo, errorDetails: 'No API Key or Cloud Function configured.' }
      };
    }

    try {
      const systemPrompt = this.buildClassificationPrompt(
        destinations,
        this.systemRole,
        weights ? Object.keys(weights) : this.metadataFields
      );
      const userParts: any[] = [{ text: systemPrompt }];

      if (options.additionalContext) {
        userParts.push({ text: `Additional User Context: ${options.additionalContext}` });
      }

      if (options.textContent) {
        userParts.push({ text: `Document Content:\n${options.textContent}` });
      }

      if (base64Data) {
        userParts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      debugInfo.promptSent = systemPrompt;

      // Turn 1 API Call: Classification & Metadata Extraction
      const call1 = await this.executeLlmCall([{ role: 'user', parts: userParts }]);
      debugInfo.modeUsed = call1.modeUsed;
      debugInfo.rawResponseText = call1.rawText;

      const cleanJson1 = call1.rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const classification: ClassificationResult = JSON.parse(cleanJson1);

      const destId = classification.destinationId || 'other';

      // Retrieve registered schema for destId
      const schemaEntry = schemas[destId] || schemas['other'];
      let targetJsonSchema: Record<string, any> = { type: 'object' };
      let schemaWrapper: GenericExtractionSchema | undefined;

      if (schemaEntry) {
        if ('jsonSchema' in schemaEntry) {
          targetJsonSchema = schemaEntry.jsonSchema;
          schemaWrapper = schemaEntry as GenericExtractionSchema;
        } else {
          targetJsonSchema = schemaEntry as Record<string, any>;
        }
      }

      // Turn 2 API Call: Structured Extraction using session history
      const step2Prompt = `
Step 2: Structured Field Extraction
Target Destination: "${classification.destinationName}" (${destId})
Instructions: Extract all key fields matching the JSON Schema below.

JSON SCHEMA:
${JSON.stringify(targetJsonSchema, null, 2)}

Return ONLY valid raw JSON matching the requested schema.
`.trim();

      const sessionContents = [
        { role: 'user', parts: userParts },
        { role: 'model', parts: [{ text: call1.rawText }] },
        { role: 'user', parts: [{ text: step2Prompt }] }
      ];

      const call2 = await this.executeLlmCall(sessionContents, targetJsonSchema);
      const cleanJson2 = call2.rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedData = JSON.parse(cleanJson2) as T;

      // Rank Entities/Cases based on extracted caseMetadata & fieldWeights
      const caseProposals = this.matchAndRankCases<C>(classification.caseMetadata, casesList, weights);

      return {
        classification,
        extractedData,
        schemaUsed: schemaWrapper,
        caseProposals,
        suggestedCase: caseProposals[0],
        debugInfo
      };
    } catch (err: any) {
      console.warn('Universal Pool pipeline error:', err);
      const fallbackClass = await this.classifyDocument(options);
      const caseProposals = this.matchAndRankCases<C>(fallbackClass.caseMetadata, casesList, weights);
      return {
        classification: fallbackClass,
        extractedData: {} as T,
        caseProposals,
        suggestedCase: caseProposals[0],
        debugInfo: { ...debugInfo, errorDetails: err?.message || String(err) }
      };
    }
  }

  /**
   * Generic filename keyword fallback
   */
  private fallbackMockClassification(
    fileName: string,
    destinations: ClassificationDestination[] = this.destinations
  ): ClassificationResult {
    const lowerName = fileName.toLowerCase();

    for (const d of destinations) {
      if (lowerName.includes(d.id.toLowerCase())) {
        return {
          destinationId: d.id,
          destinationName: d.name,
          confidence: 0.9,
          reasoning: `Matched destination keyword "${d.id}" in filename.`,
          classificationNote: `Matched document keyword "${d.id}" in filename.`,
          caseMetadata: {}
        };
      }
    }

    const firstValid = destinations.find(d => d.id !== 'other');
    if (firstValid) {
      return {
        destinationId: firstValid.id,
        destinationName: firstValid.name,
        confidence: 0.75,
        reasoning: `Defaulted to first candidate destination ${firstValid.name}.`,
        classificationNote: `Defaulted to first candidate destination ${firstValid.name}.`,
        caseMetadata: {}
      };
    }

    return {
      destinationId: 'other',
      destinationName: 'Other / Unclassified Document',
      confidence: 0.85,
      reasoning: 'Unclassified document fallback.',
      classificationNote: 'Unclassified document fallback.',
      caseMetadata: {}
    };
  }
}
