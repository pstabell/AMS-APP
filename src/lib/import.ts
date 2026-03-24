/**
 * File Import Utility Library
 * 
 * Provides CSV/Excel file parsing, column mapping, and data validation
 * for importing policies into the AMS system.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { PolicyCreateInput } from "./policies";
import { calculateAgencyCommission, getAgentRate, calculateAgentCommission } from "./calculations";

// Supported file types
export type ImportFileType = "csv" | "xlsx" | "xls" | "pdf";

// Parsed file data
export type ParsedFileData = {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName: string;
  fileType: ImportFileType;
};

// Column mapping for import
export type ColumnMapping = {
  customer?: string;
  policy_number?: string;
  carrier?: string;
  mga?: string;
  line_of_business?: string;
  premium_sold?: string;
  policy_gross_comm_pct?: string;
  transaction_type?: string;
  effective_date?: string;
  policy_origination_date?: string;
  expiration_date?: string;
  statement_date?: string;
  invoice_number?: string;
  notes?: string;
};

// Required fields for import
export const REQUIRED_FIELDS: (keyof ColumnMapping)[] = [
  "customer",
  "policy_number",
  "carrier",
  "premium_sold",
  "transaction_type",
  "effective_date",
];

// Optional fields for import
export const OPTIONAL_FIELDS: (keyof ColumnMapping)[] = [
  "mga",
  "line_of_business",
  "policy_gross_comm_pct",
  "policy_origination_date",
  "expiration_date",
  "statement_date",
  "invoice_number",
  "notes",
];

// All mappable fields
export const ALL_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: "customer", label: "Customer Name", required: true },
  { key: "policy_number", label: "Policy Number", required: true },
  { key: "carrier", label: "Carrier", required: true },
  { key: "mga", label: "MGA", required: false },
  { key: "line_of_business", label: "Line of Business", required: false },
  { key: "premium_sold", label: "Premium Sold", required: true },
  { key: "policy_gross_comm_pct", label: "Gross Comm %", required: false },
  { key: "transaction_type", label: "Transaction Type", required: true },
  { key: "effective_date", label: "Effective Date", required: true },
  { key: "policy_origination_date", label: "Policy Origination Date", required: false },
  { key: "expiration_date", label: "Expiration Date", required: false },
  { key: "statement_date", label: "Statement Date", required: false },
  { key: "invoice_number", label: "Invoice Number", required: false },
  { key: "notes", label: "Notes", required: false },
];

// Validation result for a single row
export type RowValidation = {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: Partial<PolicyCreateInput>;
};

// Overall validation result
export type ValidationResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: RowValidation[];
};

/**
 * Parse a CSV file
 */
export function parseCSV(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          headers,
          rows: results.data,
          totalRows: results.data.length,
          fileName: file.name,
          fileType: "csv",
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Parse an Excel file (xlsx or xls)
 */
export async function parseExcel(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header (as array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          dateNF: "yyyy-mm-dd",
        }) as unknown[][];

        if (jsonData.length === 0) {
          resolve({
            headers: [],
            rows: [],
            totalRows: 0,
            fileName: file.name,
            fileType: file.name.endsWith(".xlsx") ? "xlsx" : "xls",
          });
          return;
        }

        // First row is headers
        const headers = (jsonData[0] as unknown[]).map(String).filter(Boolean);
        
        // Rest are data rows
        const rows = jsonData.slice(1).map((row) => {
          const rowData: Record<string, string> = {};
          headers.forEach((header, idx) => {
            const value = (row as unknown[])[idx];
            rowData[header] = value !== undefined && value !== null ? String(value) : "";
          });
          return rowData;
        }).filter(row => Object.values(row).some(v => v.trim() !== ""));

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          fileName: file.name,
          fileType: file.name.endsWith(".xlsx") ? "xlsx" : "xls",
        });
      } catch (err) {
        reject(new Error(`Excel parsing failed: ${err instanceof Error ? err.message : "Unknown error"}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Parse a PDF file by extracting text and converting it to delimited rows.
 */
export async function parsePDF(file: File): Promise<ParsedFileData> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/import/parse-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || "PDF parsing failed");
  }

  const payload = await response.json();
  const text = String(payload.text || "");
  const { headers, rows } = parseDelimitedText(text);

  return {
    headers,
    rows,
    totalRows: rows.length,
    fileName: file.name,
    fileType: "pdf",
  };
}

function parseDelimitedText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiterCandidates = [",", "\t", "|"];
  let bestDelimiter = ",";
  let bestScore = 0;
  let headerIndex = 0;

  lines.forEach((line, idx) => {
    delimiterCandidates.forEach((delimiter) => {
      const parts = line.split(delimiter).map((p) => p.trim());
      if (parts.length > bestScore) {
        bestScore = parts.length;
        bestDelimiter = delimiter;
        headerIndex = idx;
      }
    });
  });

  if (bestScore < 2) {
    throw new Error("Unable to detect a table structure in the PDF. Please export a CSV/Excel file instead.");
  }

  const headers = lines[headerIndex]
    .split(bestDelimiter)
    .map((header) => header.trim())
    .filter(Boolean);

  const rows = lines.slice(headerIndex + 1).map((line) => {
    const values = line.split(bestDelimiter).map((value) => value.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    return row;
  }).filter(row => Object.values(row).some(value => value.trim() !== ""));

  return { headers, rows };
}

/**
 * Parse a file based on its type
 */
export async function parseFile(file: File): Promise<ParsedFileData> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith(".csv")) {
    return parseCSV(file);
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    return parseExcel(file);
  } else if (fileName.endsWith(".pdf")) {
    return parsePDF(file);
  } else {
    throw new Error("Unsupported file type. Please upload a CSV, Excel, or PDF file.");
  }
}

/**
 * Auto-detect column mapping based on header names
 */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // Common patterns for each field
  const patterns: { key: keyof ColumnMapping; patterns: string[] }[] = [
    { key: "customer", patterns: ["customer", "insured", "client", "name", "customer name", "insured name"] },
    { key: "policy_number", patterns: ["policy", "policy number", "policy #", "policy_number", "pol #", "pol number"] },
    { key: "carrier", patterns: ["carrier", "insurance company", "company", "insurer"] },
    { key: "mga", patterns: ["mga", "managing general agent", "wholesaler"] },
    { key: "line_of_business", patterns: ["line of business", "lob", "line", "coverage type", "type"] },
    { key: "premium_sold", patterns: ["premium", "premium sold", "premium_sold", "written premium", "gross premium"] },
    { key: "policy_gross_comm_pct", patterns: ["comm %", "commission %", "gross comm", "commission rate", "comm pct", "comm rate"] },
    { key: "transaction_type", patterns: ["transaction", "trans type", "transaction type", "trans", "type"] },
    { key: "effective_date", patterns: ["effective", "effective date", "eff date", "start date"] },
    { key: "policy_origination_date", patterns: ["origination", "original date", "policy origination", "orig date"] },
    { key: "expiration_date", patterns: ["expiration", "exp date", "expiration date", "end date"] },
    { key: "statement_date", patterns: ["statement", "statement date", "stmt date"] },
    { key: "invoice_number", patterns: ["invoice", "invoice #", "invoice number", "inv #"] },
    { key: "notes", patterns: ["notes", "comments", "memo", "remarks"] },
  ];

  patterns.forEach(({ key, patterns: fieldPatterns }) => {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      if (fieldPatterns.some((p) => header === p || header.includes(p))) {
        mapping[key] = headers[i];
        break;
      }
    }
  });

  return mapping;
}

/**
 * Parse a date string into YYYY-MM-DD format
 */
function parseDate(value: string): string | null {
  if (!value || value.trim() === "") return null;
  
  const trimmed = value.trim();
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to parse various date formats
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  // Try MM/DD/YYYY format
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdyMatch) {
    let year = parseInt(mdyMatch[3]);
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    const month = String(parseInt(mdyMatch[1])).padStart(2, "0");
    const day = String(parseInt(mdyMatch[2])).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

/**
 * Parse a number from a string
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, "").trim();
  
  // Handle parentheses for negative numbers
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    const num = parseFloat(cleaned.slice(1, -1));
    return isNaN(num) ? null : -num;
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Normalize transaction type to standard codes
 */
function normalizeTransactionType(value: string): string {
  const normalized = value.toUpperCase().trim();
  
  const typeMap: Record<string, string> = {
    "NEW": "NEW",
    "NEW BUSINESS": "NEW",
    "NB": "NEW",
    "NBS": "NBS",
    "NEW BUSINESS SPECIAL": "NBS",
    "RWL": "RWL",
    "RENEWAL": "RWL",
    "REN": "RWL",
    "END": "END",
    "ENDORSEMENT": "END",
    "PCH": "PCH",
    "POLICY CHANGE": "PCH",
    "CHANGE": "PCH",
    "CAN": "CAN",
    "CANCEL": "CAN",
    "CANCELLATION": "CAN",
    "XCL": "XCL",
    "EXCLUDE": "XCL",
    "EXCLUDED": "XCL",
  };
  
  return typeMap[normalized] || normalized;
}

/**
 * Validate and transform imported data using column mapping
 */
export function validateImportData(
  parsedData: ParsedFileData,
  mapping: ColumnMapping,
  userEmail: string,
  userId: string
): ValidationResult {
  const result: ValidationResult = {
    totalRows: parsedData.totalRows,
    validRows: 0,
    invalidRows: 0,
    rows: [],
  };

  parsedData.rows.forEach((row, index) => {
    const rowValidation: RowValidation = {
      rowIndex: index + 1, // 1-indexed for user display
      isValid: true,
      errors: [],
      warnings: [],
      data: {},
    };

    // Extract values using mapping
    const getValue = (field: keyof ColumnMapping): string => {
      const columnName = mapping[field];
      return columnName ? (row[columnName] || "").trim() : "";
    };

    // Customer (required)
    const customer = getValue("customer");
    if (!customer) {
      rowValidation.errors.push("Customer name is required");
      rowValidation.isValid = false;
    } else {
      rowValidation.data.customer = customer;
    }

    // Policy Number (required)
    const policyNumber = getValue("policy_number");
    if (!policyNumber) {
      rowValidation.errors.push("Policy number is required");
      rowValidation.isValid = false;
    } else {
      rowValidation.data.policy_number = policyNumber;
    }

    // Carrier (required)
    const carrier = getValue("carrier");
    if (!carrier) {
      rowValidation.errors.push("Carrier is required");
      rowValidation.isValid = false;
    } else {
      rowValidation.data.carrier = carrier;
    }

    // Premium Sold (required)
    const premiumStr = getValue("premium_sold");
    const premium = parseNumber(premiumStr);
    if (premium === null) {
      rowValidation.errors.push("Premium sold is required and must be a valid number");
      rowValidation.isValid = false;
    } else {
      rowValidation.data.premium_sold = premium;
    }

    // Transaction Type (required)
    const txType = getValue("transaction_type");
    if (!txType) {
      rowValidation.errors.push("Transaction type is required");
      rowValidation.isValid = false;
    } else {
      const normalizedType = normalizeTransactionType(txType);
      if (!["NEW", "NBS", "RWL", "END", "PCH", "CAN", "XCL"].includes(normalizedType)) {
        rowValidation.warnings.push(`Unknown transaction type "${txType}" - defaulting to NEW`);
        rowValidation.data.transaction_type = "NEW";
      } else {
        rowValidation.data.transaction_type = normalizedType;
      }
    }

    // Effective Date (required)
    const effDateStr = getValue("effective_date");
    const effDate = parseDate(effDateStr);
    if (!effDate) {
      rowValidation.errors.push("Effective date is required and must be a valid date");
      rowValidation.isValid = false;
    } else {
      rowValidation.data.effective_date = effDate;
    }

    // Optional fields
    const mga = getValue("mga");
    if (mga) rowValidation.data.mga = mga;

    const lob = getValue("line_of_business");
    if (lob) rowValidation.data.line_of_business = lob;

    const commPct = parseNumber(getValue("policy_gross_comm_pct"));
    rowValidation.data.policy_gross_comm_pct = commPct ?? 10; // Default to 10%

    const origDate = parseDate(getValue("policy_origination_date"));
    if (origDate) rowValidation.data.policy_origination_date = origDate;

    const expDate = parseDate(getValue("expiration_date"));
    if (expDate) rowValidation.data.expiration_date = expDate;

    const stmtDate = parseDate(getValue("statement_date"));
    if (stmtDate) rowValidation.data.statement_date = stmtDate;

    const invoiceNum = getValue("invoice_number");
    if (invoiceNum) rowValidation.data.invoice_number = invoiceNum;

    const notes = getValue("notes");
    if (notes) rowValidation.data.notes = notes;

    // Calculate commission values
    if (rowValidation.isValid && rowValidation.data.premium_sold !== undefined) {
      const agencyComm = calculateAgencyCommission(
        rowValidation.data.premium_sold,
        rowValidation.data.policy_gross_comm_pct || 10
      );
      rowValidation.data.agency_estimated_comm = agencyComm;

      const agentRate = getAgentRate(
        rowValidation.data.transaction_type || "NEW",
        rowValidation.data.policy_origination_date,
        rowValidation.data.effective_date
      );
      const agentComm = calculateAgentCommission(agencyComm, agentRate);
      rowValidation.data.agent_estimated_comm = agentComm;
      rowValidation.data.agent_paid_amount = 0;
    }

    // Add user info
    rowValidation.data.user_email = userEmail;
    rowValidation.data.user_id = userId;

    // Update counts
    if (rowValidation.isValid) {
      result.validRows++;
    } else {
      result.invalidRows++;
    }

    result.rows.push(rowValidation);
  });

  return result;
}

/**
 * Get sample data for preview
 */
export function getPreviewData(
  parsedData: ParsedFileData,
  mapping: ColumnMapping,
  limit: number = 5
): Record<string, string>[] {
  return parsedData.rows.slice(0, limit).map((row) => {
    const preview: Record<string, string> = {};
    Object.entries(mapping).forEach(([field, column]) => {
      if (column && row[column]) {
        preview[field] = row[column];
      }
    });
    return preview;
  });
}
