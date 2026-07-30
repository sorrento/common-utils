/**
 * Reusable Export Service for PDF and Excel documents
 * Elegant styling, multi-sheet Excel generation, crisp HTML2Canvas PDF exports.
 */

import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface KpiExportItem {
  label: string;
  value: string;
  trend?: string;
  accentColor?: string;
}

export interface TableExportSection {
  title?: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  note?: string;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  generatedBy?: string;
  brandName?: string;
  brandTagline?: string;
  kpis?: KpiExportItem[];
  sections: TableExportSection[];
  footerNote?: string;
}

export interface ExcelTabConfig {
  name: string;
  title: string;
  subtitle?: string;
  kpis?: KpiExportItem[];
  headers: string[];
  rows: (string | number)[][];
}

export interface ExcelExportOptions {
  filename: string;
  brandName?: string;
  summaryTab?: ExcelTabConfig;
  detailTab?: ExcelTabConfig;
  tabs?: ExcelTabConfig[];
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates and directly downloads a high-resolution, beautifully styled PDF document
 */
export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const brandName = options.brandName || 'EXECUTIVE OS';
  const brandTagline = options.brandTagline || 'REPORT GENERATOR';

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '820px';
  container.style.background = '#ffffff';
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  container.style.color = '#102033';

  container.innerHTML = `
    <!-- Header Banner -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:2px solid #16324F;margin-bottom:22px;">
      <div>
        <div style="display:inline-block;background:#16324F;color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.8px;padding:4px 10px;border-radius:4px;margin-bottom:6px;text-transform:uppercase;">
          ${escapeHtml(brandName)}
        </div>
        <div style="font-size:24px;font-weight:700;color:#16324F;margin-bottom:4px;letter-spacing:-0.3px;">
          ${escapeHtml(options.title)}
        </div>
        ${options.subtitle ? `<div style="font-size:12.5px;color:#496074;font-weight:500;">${escapeHtml(options.subtitle)}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:11px;color:#7D93A6;">
        <strong style="display:block;color:#16324F;font-size:12px;margin-bottom:2px;">${escapeHtml(brandTagline)}</strong>
        <div>Fecha: ${dateStr}</div>
        ${options.generatedBy ? `<div>Emitido: ${escapeHtml(options.generatedBy)}</div>` : ''}
      </div>
    </div>

    <!-- KPI Cards Grid -->
    ${options.kpis && options.kpis.length > 0 ? `
      <div style="display:grid;grid-template-columns:repeat(${Math.min(options.kpis.length, 4)}, 1fr);gap:12px;margin-bottom:22px;">
        ${options.kpis.map(kpi => `
          <div style="background:#F5FAFC;border:1px solid #D9E6EC;border-radius:10px;padding:12px 14px;position:relative;overflow:hidden;">
            <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${kpi.accentColor || '#2B73E0'};"></div>
            <div style="font-size:10px;font-weight:700;color:#5A738E;text-transform:uppercase;margin-bottom:4px;">${escapeHtml(kpi.label)}</div>
            <div style="font-size:17px;font-weight:800;color:#0F2942;line-height:1.2;">${escapeHtml(kpi.value)}</div>
            ${kpi.trend ? `<div style="font-size:10px;color:#057A55;font-weight:700;margin-top:4px;">${escapeHtml(kpi.trend)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Table Sections -->
    ${options.sections.map(sec => `
      <div style="margin-bottom:24px;">
        ${sec.title ? `<div style="font-size:14px;font-weight:700;color:#16324F;margin-bottom:4px;border-left:3px solid #2B73E0;padding-left:8px;">${escapeHtml(sec.title)}</div>` : ''}
        ${sec.subtitle ? `<div style="font-size:11px;color:#637C95;margin-bottom:8px;padding-left:11px;">${escapeHtml(sec.subtitle)}</div>` : ''}
        
        <table style="width:100%;border-collapse:separate;border-spacing:0;border-radius:8px;overflow:hidden;border:1px solid #D9E6EC;font-size:11px;">
          <thead>
            <tr style="background:#16324F;color:#ffffff;">
              ${sec.headers.map(h => `<th style="padding:8px 10px;text-align:left;font-weight:700;font-size:10.5px;letter-spacing:0.3px;border-bottom:1px solid #0F253C;">${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${sec.rows.map((row, idx) => `
              <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F7FAFC'};">
                ${row.map(cell => `<td style="padding:7px 10px;border-bottom:1px solid #EAEFF4;color:#23395B;font-size:11px;">${escapeHtml(String(cell))}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${sec.note ? `<div style="font-size:10px;color:#7A8E9F;font-style:italic;margin-top:4px;padding-left:4px;">* ${escapeHtml(sec.note)}</div>` : ''}
      </div>
    `).join('')}

    <!-- Footer -->
    <div style="margin-top:30px;padding-top:12px;border-top:1px solid #E1E9F0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#899EAF;">
      <div>${options.footerNote ? escapeHtml(options.footerNote) : 'Confidencial — Reporte automatizado.'}</div>
      <div>Página 1 de 1</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${options.filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates and downloads a binary .xlsx Excel Workbook with FULL RICH STYLING
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.brandName || 'Executive Tools';
  workbook.created = new Date();

  const tabs: ExcelTabConfig[] = [];

  if (options.summaryTab) tabs.push(options.summaryTab);
  if (options.detailTab) tabs.push(options.detailTab);
  if (options.tabs && options.tabs.length > 0) tabs.push(...options.tabs);

  if (tabs.length === 0) {
    throw new Error('At least one tab config is required for Excel export');
  }

  for (const tabConfig of tabs) {
    const sheet = workbook.addWorksheet(tabConfig.name, {
      views: [{ showGridLines: true }],
    });

    let currentRow = 1;

    // Header Title
    sheet.mergeCells(currentRow, 1, currentRow, Math.max(tabConfig.headers.length, 5));
    const titleCell = sheet.getCell(currentRow, 1);
    titleCell.value = `${options.brandName ? options.brandName.toUpperCase() + ' — ' : ''}${tabConfig.title}`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16324F' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(currentRow).height = 30;

    currentRow++;

    // Subtitle
    if (tabConfig.subtitle) {
      sheet.mergeCells(currentRow, 1, currentRow, Math.max(tabConfig.headers.length, 5));
      const subCell = sheet.getCell(currentRow, 1);
      subCell.value = `Subtítulo: ${tabConfig.subtitle} | Generado: ${new Date().toLocaleDateString('es-ES')}`;
      subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '496074' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      sheet.getRow(currentRow).height = 20;
      currentRow++;
    }

    currentRow++; // Empty spacing

    // KPI Cards inside Excel (if provided)
    if (tabConfig.kpis && tabConfig.kpis.length > 0) {
      tabConfig.kpis.forEach((kpi, index) => {
        const colStart = (index * 2) + 1;
        const colEnd = colStart + 1;
        if (colEnd <= tabConfig.headers.length + 2) {
          sheet.mergeCells(currentRow, colStart, currentRow, colEnd);
          const kpiLabelCell = sheet.getCell(currentRow, colStart);
          kpiLabelCell.value = kpi.label.toUpperCase();
          kpiLabelCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '5A738E' } };
          kpiLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };
          kpiLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

          sheet.mergeCells(currentRow + 1, colStart, currentRow + 1, colEnd);
          const kpiValueCell = sheet.getCell(currentRow + 1, colStart);
          kpiValueCell.value = kpi.value;
          kpiValueCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: '16324F' } };
          kpiValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };
          kpiValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      sheet.getRow(currentRow).height = 18;
      sheet.getRow(currentRow + 1).height = 24;
      currentRow += 3;
    }

    // Table Column Headers
    const headerRow = sheet.getRow(currentRow);
    tabConfig.headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16324F' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: '0F253C' } },
        bottom: { style: 'medium', color: { argb: '0F253C' } },
      };
    });
    headerRow.height = 24;
    currentRow++;

    // Data Rows
    tabConfig.rows.forEach((rowValues, rowIndex) => {
      const r = sheet.getRow(currentRow);
      rowValues.forEach((val, i) => {
        const cell = r.getCell(i + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, color: { argb: '102033' } };

        // Alternating fill
        if (rowIndex % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFC' } };
        }

        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E1E9F0' } },
          left: { style: 'thin', color: { argb: 'E1E9F0' } },
          right: { style: 'thin', color: { argb: 'E1E9F0' } },
        };
      });
      r.height = 20;
      currentRow++;
    });

    // Auto-fit column widths
    sheet.columns.forEach(col => {
      let maxLen = 12;
      col.eachCell!({ includeEmpty: false }, cell => {
        const val = String(cell.value || '');
        if (val.length > maxLen && val.length < 50) {
          maxLen = val.length;
        }
      });
      col.width = maxLen + 4;
    });
  }

  // Trigger browser binary download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.filename}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
