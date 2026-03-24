"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createPolicy, type PolicyCreateInput } from "@/lib/policies";
import { formatCurrency, formatDate } from "@/lib/calculations";
import {
  parseFile,
  autoDetectMapping,
  validateImportData,
  ALL_FIELDS,
  type ParsedFileData,
  type ColumnMapping,
  type ValidationResult,
  type RowValidation,
} from "@/lib/import";

// Wizard steps
type WizardStep = "upload" | "mapping" | "preview" | "import" | "complete";

export default function ImportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState<WizardStep>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File data state
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Import progress state
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsed = await parseFile(file);
      setParsedData(parsed);

      // Auto-detect column mapping
      const autoMapping = autoDetectMapping(parsed.headers);
      setColumnMapping(autoMapping);

      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check file type
    const fileName = file.name.toLowerCase();
    if (
      !fileName.endsWith(".csv") &&
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls") &&
      !fileName.endsWith(".pdf")
    ) {
      setError("Please upload a CSV, Excel, or PDF file (.csv, .xlsx, .xls, .pdf)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsed = await parseFile(file);
      setParsedData(parsed);

      const autoMapping = autoDetectMapping(parsed.headers);
      setColumnMapping(autoMapping);

      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Update column mapping
  const updateMapping = (field: keyof ColumnMapping, column: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: column || undefined,
    }));
  };

  // Validate data with current mapping
  const validateData = useCallback(() => {
    if (!parsedData || !user?.email || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = validateImportData(parsedData, columnMapping, user.email, user.id);
      setValidationResult(result);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsLoading(false);
    }
  }, [parsedData, columnMapping, user?.email, user?.id]);

  // Import valid records
  const importRecords = useCallback(async () => {
    if (!validationResult) return;

    const validRows = validationResult.rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setError("No valid records to import");
      return;
    }

    setStep("import");
    setImportProgress({ current: 0, total: validRows.length });
    setImportResults({ success: 0, failed: 0, errors: [] });

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const policyData = row.data as PolicyCreateInput;
        const { error: createError } = await createPolicy(policyData);

        if (createError) {
          setImportResults((prev) => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, `Row ${row.rowIndex}: ${createError}`],
          }));
        } else {
          setImportResults((prev) => ({
            ...prev,
            success: prev.success + 1,
          }));
        }
      } catch (err) {
        setImportResults((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          errors: [...prev.errors, `Row ${row.rowIndex}: Unexpected error`],
        }));
      }

      setImportProgress({ current: i + 1, total: validRows.length });
    }

    setStep("complete");
  }, [validationResult]);

  // Reset wizard
  const resetWizard = () => {
    setStep("upload");
    setParsedData(null);
    setColumnMapping({});
    setValidationResult(null);
    setImportProgress({ current: 0, total: 0 });
    setImportResults({ success: 0, failed: 0, errors: [] });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps: { key: WizardStep; label: string }[] = [
      { key: "upload", label: "Upload File" },
      { key: "mapping", label: "Map Columns" },
      { key: "preview", label: "Preview & Validate" },
      { key: "import", label: "Import" },
      { key: "complete", label: "Complete" },
    ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="mb-8 flex items-center justify-center">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                idx <= currentIndex
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {idx + 1}
            </div>
            <span
              className={`ml-2 hidden text-sm sm:inline ${
                idx <= currentIndex ? "font-medium text-slate-900" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-12 ${
                  idx < currentIndex ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-12 text-center transition hover:border-slate-400"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="mb-4 text-5xl">📁</div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Upload Import File
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Drag and drop or click to select a CSV, Excel, or PDF file
        </p>
        <p className="text-xs text-slate-500">
          Supported formats: .csv, .xlsx, .xls, .pdf
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600">Parsing file...</p>
        </div>
      )}

      {/* Template Download */}
      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <h4 className="mb-2 font-medium text-slate-900">Need a template?</h4>
        <p className="mb-3 text-sm text-slate-600">
          Download our import template to ensure your data is formatted correctly.
        </p>
        <button
          type="button"
          onClick={() => {
            const headers = ALL_FIELDS.map((f) => f.label).join(",");
            const sampleRow = [
              "John Smith",
              "POL-001",
              "Acme Insurance",
              "Premier MGA",
              "Commercial Auto",
              "5000",
              "12",
              "NEW",
              "2024-01-15",
              "2024-01-15",
              "2025-01-15",
              "",
              "",
              "Sample policy",
            ].join(",");
            const csvContent = `${headers}\n${sampleRow}`;
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "policy-import-template.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Download Template (CSV)
        </button>
      </div>
    </div>
  );

  // Render mapping step
  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Map Columns</h3>
            <p className="text-sm text-slate-600">
              Match your file columns to AMS fields. Required fields are marked with *.
            </p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>
              <strong>{parsedData?.fileName}</strong>
            </p>
            <p>{parsedData?.totalRows} rows found</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {ALL_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400"
                value={columnMapping[field.key] || ""}
                onChange={(e) => updateMapping(field.key, e.target.value)}
              >
                <option value="">-- Select Column --</option>
                {parsedData?.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={resetWizard}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={validateData}
            disabled={isLoading}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {isLoading ? "Validating..." : "Validate Data"}
          </button>
        </div>
      </div>

      {/* Preview of raw data */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 font-semibold text-slate-900">Sample Data Preview</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {parsedData?.headers.slice(0, 8).map((header) => (
                  <th key={header} className="py-2 pr-4 text-left font-medium text-slate-600">
                    {header}
                  </th>
                ))}
                {(parsedData?.headers.length || 0) > 8 && (
                  <th className="py-2 text-left font-medium text-slate-500">...</th>
                )}
              </tr>
            </thead>
            <tbody>
              {parsedData?.rows.slice(0, 3).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  {parsedData.headers.slice(0, 8).map((header) => (
                    <td key={header} className="py-2 pr-4 text-slate-700">
                      {row[header]?.substring(0, 30) || "-"}
                      {(row[header]?.length || 0) > 30 && "..."}
                    </td>
                  ))}
                  {parsedData.headers.length > 8 && (
                    <td className="py-2 text-slate-500">...</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">
            {validationResult?.totalRows ?? 0}
          </p>
          <p className="text-sm text-slate-600">Total Rows</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-2xl font-bold text-green-700">
            {validationResult?.validRows ?? 0}
          </p>
          <p className="text-sm text-green-600">Valid Rows</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-2xl font-bold text-red-700">
            {validationResult?.invalidRows ?? 0}
          </p>
          <p className="text-sm text-red-600">Invalid Rows</p>
        </div>
      </div>

      {/* Errors and Warnings */}
      {validationResult && validationResult.invalidRows > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h4 className="mb-3 font-semibold text-red-800">Validation Errors</h4>
          <div className="max-h-48 overflow-y-auto">
            {validationResult.rows
              .filter((r) => !r.isValid)
              .slice(0, 10)
              .map((row) => (
                <div key={row.rowIndex} className="mb-2 text-sm text-red-700">
                  <strong>Row {row.rowIndex}:</strong>{" "}
                  {row.errors.join(", ")}
                </div>
              ))}
            {validationResult.invalidRows > 10 && (
              <p className="text-sm text-red-600">
                And {validationResult.invalidRows - 10} more errors...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="mb-4 font-semibold text-slate-900">
          Data Preview (First 10 Valid Records)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 text-left font-medium text-slate-600">#</th>
                <th className="py-2 pr-4 text-left font-medium text-slate-600">Customer</th>
                <th className="py-2 pr-4 text-left font-medium text-slate-600">Policy #</th>
                <th className="py-2 pr-4 text-left font-medium text-slate-600">Carrier</th>
                <th className="py-2 pr-4 text-left font-medium text-slate-600">Type</th>
                <th className="py-2 pr-4 text-right font-medium text-slate-600">Premium</th>
                <th className="py-2 text-left font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {validationResult?.rows.slice(0, 10).map((row) => (
                <tr
                  key={row.rowIndex}
                  className={`border-b border-slate-100 ${
                    !row.isValid ? "bg-red-50" : ""
                  }`}
                >
                  <td className="py-2 pr-4 text-slate-700">{row.rowIndex}</td>
                  <td className="py-2 pr-4 text-slate-700">
                    {row.data.customer || "-"}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {row.data.policy_number || "-"}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {row.data.carrier || "-"}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {row.data.transaction_type || "-"}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700">
                    {row.data.premium_sold
                      ? formatCurrency(row.data.premium_sold)
                      : "-"}
                  </td>
                  <td className="py-2">
                    {row.isValid ? (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Valid
                      </span>
                    ) : (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Invalid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep("mapping")}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to Mapping
        </button>
        <button
          type="button"
          onClick={importRecords}
          disabled={!validationResult || validationResult.validRows === 0}
          className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          Import {validationResult?.validRows ?? 0} Valid Records
        </button>
      </div>
    </div>
  );

  // Render import progress step
  const renderImportStep = () => (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mb-4 text-5xl">⏳</div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Importing Policies
        </h3>
        <p className="mb-6 text-sm text-slate-600">
          Please wait while we import your policies...
        </p>

        <div className="mx-auto mb-4 h-2 max-w-md overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{
              width: `${
                importProgress.total > 0
                  ? (importProgress.current / importProgress.total) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <p className="text-sm text-slate-600">
          {importProgress.current} of {importProgress.total} records processed
        </p>

        <div className="mt-4 flex justify-center gap-6">
          <div>
            <p className="text-lg font-bold text-green-600">
              {importResults.success}
            </p>
            <p className="text-xs text-slate-600">Imported</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">
              {importResults.failed}
            </p>
            <p className="text-xs text-slate-600">Failed</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Import Complete
          </h3>
          <p className="mb-6 text-sm text-slate-600">
            Your import has finished processing.
          </p>

          <div className="mb-6 flex justify-center gap-8">
            <div>
              <p className="text-3xl font-bold text-green-600">
                {importResults.success}
              </p>
              <p className="text-sm text-slate-600">Imported Successfully</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">
                {importResults.failed}
              </p>
              <p className="text-sm text-slate-600">Failed</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={resetWizard}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Import More
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/policies")}
              className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Policies
            </button>
          </div>
        </div>
      </div>

      {/* Error details if any */}
      {importResults.errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h4 className="mb-3 font-semibold text-red-800">Import Errors</h4>
          <div className="max-h-48 overflow-y-auto">
            {importResults.errors.slice(0, 20).map((error, idx) => (
              <p key={idx} className="mb-1 text-sm text-red-700">
                {error}
              </p>
            ))}
            {importResults.errors.length > 20 && (
              <p className="text-sm text-red-600">
                And {importResults.errors.length - 20} more errors...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Import Policies</h2>
        <p className="text-sm text-slate-600">
          Import policies from CSV or Excel files with automatic column mapping.
        </p>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step Content */}
      {step === "upload" && renderUploadStep()}
      {step === "mapping" && renderMappingStep()}
      {step === "preview" && renderPreviewStep()}
      {step === "import" && renderImportStep()}
      {step === "complete" && renderCompleteStep()}
    </div>
  );
}
