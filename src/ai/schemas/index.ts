import pdaSchema from './pdaSchema.json';
import voyageSchema from './voyageSchema.json';

export const PDA_JSON_SCHEMA = pdaSchema;
export const VOYAGE_EXTRACTION_SCHEMA = voyageSchema;

/**
 * Standard prompt template for Proforma Disbursement Account (PDA) extraction
 */
export const PDA_EXTRACTION_PROMPT = `
You are an expert maritime shipping assistant. Analyze the attached Proforma Disbursement Account (PDA) PDF document.
Extract all key vessel and financial data into a clean JSON structure matching the requested schema.
Be exact with monetary figures, currency amounts, vessel names, ports, and line item concepts.
`.trim();

/**
 * Standard prompt template for Voyage / Fixture Note / Instructions extraction
 */
export const VOYAGE_EXTRACTION_PROMPT = `
You are an expert maritime chartering assistant. Analyze the attached voyage instructions, fixture recap or document.
Extract vessel name, voyage number, charterer, loading port, discharge ports, cargo description, quantity, and laycan.
`.trim();
