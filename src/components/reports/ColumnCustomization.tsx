"use client";

import { useState, useEffect } from "react";

export type ColumnConfig = {
  key: string;
  label: string;
  visible: boolean;
  width: number;
  order: number;
};

export type ColumnTemplate = {
  id: string;
  name: string;
  description: string;
  columns: ColumnConfig[];
};

type ColumnCustomizationProps = {
  viewMode: 'aggregated' | 'detailed';
  columns: ColumnConfig[];
  templates: ColumnTemplate[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  onTemplateChange: (template: ColumnTemplate) => void;
  onSaveTemplate: (name: string, description: string) => void;
};

const DEFAULT_COLUMNS = {
  aggregated: [
    { key: 'policyNumber', label: 'Policy Number', visible: true, width: 150, order: 1 },
    { key: 'customer', label: 'Customer', visible: true, width: 200, order: 2 },
    { key: 'carrier', label: 'Carrier', visible: true, width: 120, order: 3 },
    { key: 'lineOfBusiness', label: 'Line of Business', visible: true, width: 140, order: 4 },
    { key: 'transactionCount', label: 'Transaction Count', visible: true, width: 120, order: 5 },
    { key: 'effectiveDate', label: 'Effective Date', visible: true, width: 120, order: 6 },
    { key: 'lastStatementMonth', label: 'Last Statement', visible: true, width: 120, order: 7 },
    { key: 'totalPremium', label: 'Total Premium', visible: true, width: 120, order: 8 },
    { key: 'totalAgentComm', label: 'Agent Commission', visible: true, width: 130, order: 9 },
    { key: 'totalPaid', label: 'Paid Amount', visible: true, width: 120, order: 10 },
    { key: 'balance', label: 'Balance', visible: true, width: 120, order: 11 },
    { key: 'indicators', label: 'Indicators', visible: true, width: 100, order: 12 },
  ],
  detailed: [
    { key: 'policyNumber', label: 'Policy Number', visible: true, width: 150, order: 1 },
    { key: 'effectiveDate', label: 'Effective Date', visible: true, width: 120, order: 2 },
    { key: 'statementMonth', label: 'Statement Month', visible: true, width: 120, order: 3 },
    { key: 'customer', label: 'Customer', visible: true, width: 200, order: 4 },
    { key: 'carrier', label: 'Carrier', visible: true, width: 120, order: 5 },
    { key: 'lineOfBusiness', label: 'Line of Business', visible: true, width: 140, order: 6 },
    { key: 'transactionType', label: 'Transaction Type', visible: true, width: 140, order: 7 },
    { key: 'premiumSold', label: 'Premium', visible: true, width: 120, order: 8 },
    { key: 'agentCommission', label: 'Agent Commission', visible: true, width: 130, order: 9 },
    { key: 'paidAmount', label: 'Paid Amount', visible: true, width: 120, order: 10 },
    { key: 'balance', label: 'Balance', visible: true, width: 120, order: 11 },
    { key: 'indicator', label: 'Indicator', visible: true, width: 100, order: 12 },
  ],
};

export default function ColumnCustomization({
  viewMode,
  columns,
  templates,
  onColumnsChange,
  onTemplateChange,
  onSaveTemplate,
}: ColumnCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleColumnVisibilityChange = (key: string, visible: boolean) => {
    const updated = localColumns.map(col =>
      col.key === key ? { ...col, visible } : col
    );
    setLocalColumns(updated);
  };

  const handleColumnWidthChange = (key: string, width: number) => {
    const updated = localColumns.map(col =>
      col.key === key ? { ...col, width: Math.max(80, Math.min(400, width)) } : col
    );
    setLocalColumns(updated);
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const updated = [...localColumns];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    
    // Update order values
    updated.forEach((col, index) => {
      col.order = index + 1;
    });
    
    setLocalColumns(updated);
  };

  const applyChanges = () => {
    onColumnsChange(localColumns);
    setIsOpen(false);
  };

  const resetToDefaults = () => {
    const defaultCols = DEFAULT_COLUMNS[viewMode];
    setLocalColumns(defaultCols);
  };

  const applyTemplate = (template: ColumnTemplate) => {
    setLocalColumns(template.columns);
    onTemplateChange(template);
  };

  const saveTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    onSaveTemplate(newTemplateName.trim(), newTemplateDescription.trim());
    setNewTemplateName('');
    setNewTemplateDescription('');
    setShowTemplateDialog(false);
  };

  const visibleColumns = localColumns.filter(col => col.visible);
  const hiddenColumns = localColumns.filter(col => !col.visible);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 0a2 2 0 012-2h2a2 2 0 002-2" />
        </svg>
        Customize Columns
        <span className="ml-1 text-xs text-slate-500">({visibleColumns.length})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Customize Columns - {viewMode === 'aggregated' ? 'Aggregated' : 'Detailed'} View
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Templates Section */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-slate-800">Templates</h4>
                  <button
                    onClick={() => setShowTemplateDialog(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Save Current as Template
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {template.name}
                    </button>
                  ))}
                  <button
                    onClick={resetToDefaults}
                    className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>

              {/* Visible Columns */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-slate-800">Visible Columns ({visibleColumns.length})</h4>
                <div className="space-y-2">
                  {visibleColumns
                    .sort((a, b) => a.order - b.order)
                    .map((column, index) => (
                    <div
                      key={column.key}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveColumn(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveColumn(index, Math.min(visibleColumns.length - 1, index + 1))}
                          disabled={index === visibleColumns.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <span className="font-medium text-slate-900">{column.label}</span>
                        <span className="ml-2 text-sm text-slate-500">({column.key})</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Width:</label>
                        <input
                          type="number"
                          min="80"
                          max="400"
                          value={column.width}
                          onChange={(e) => handleColumnWidthChange(column.key, parseInt(e.target.value))}
                          className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-slate-500">px</span>
                      </div>
                      
                      <button
                        onClick={() => handleColumnVisibilityChange(column.key, false)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L18 18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden Columns */}
              {hiddenColumns.length > 0 && (
                <div>
                  <h4 className="mb-3 font-medium text-slate-800">Hidden Columns ({hiddenColumns.length})</h4>
                  <div className="space-y-2">
                    {hiddenColumns.map(column => (
                      <div
                        key={column.key}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 p-3"
                      >
                        <div>
                          <span className="font-medium text-slate-600">{column.label}</span>
                          <span className="ml-2 text-sm text-slate-400">({column.key})</span>
                        </div>
                        <button
                          onClick={() => handleColumnVisibilityChange(column.key, true)}
                          className="p-1 text-slate-400 hover:text-green-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyChanges}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Save Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Commission Review"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Brief description of this template..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                disabled={!newTemplateName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}