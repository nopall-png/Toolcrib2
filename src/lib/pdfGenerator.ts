import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserRequestItem, ToolItem } from './mock';

export const generateRequestPDFBlob = (
  items: UserRequestItem[],
  tools: ToolItem[],
  userName: string,
  requestNo?: string
): string => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Toolcrib Request Form', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Requestor: ${userName}`, 14, 32);
  if (requestNo) {
    doc.text(`Request No: ${requestNo}`, 14, 38);
  }
  doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 14, requestNo ? 44 : 38);

  const tableColumn = ["No", "Parts Deskripsi", "Spec", "Pemesanan Apa", "Unit Prices", "Total Cost"];
  const tableRows: (string | number)[][] = [];
  
  let grandTotal = 0;

  items.forEach((item, index) => {
    // Find tool to get specs and price
    const tool = tools.find(t => t.id === item.toolId);
    
    const partsDesc = item.toolName;
    const spec = tool?.description || tool?.category || '-';
    const qty = `${item.quantity} ${item.unit}`;
    
    // In our mock, if unitPrice doesn't exist, we fallback to 0. 
    // Format to IDR
    const price = tool?.unitPrice || 0;
    const total = price * item.quantity;
    grandTotal += total;

    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total);

    tableRows.push([
      (index + 1).toString(),
      partsDesc,
      spec,
      qty,
      formattedPrice,
      formattedTotal
    ]);
  });
  
  // Add Grand Total row at the bottom
  tableRows.push([
    "", "", "", "", "GRAND TOTAL",
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotal)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: requestNo ? 52 : 46,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }, // slate-900
    styles: { fontSize: 10, cellPadding: 4 },
  });

  // Return as Blob URL for iframe
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

export const generateProcurementPDFBlob = (
  prs: any[]
): string => {
  if (prs.length === 0) return '';
  const doc = new jsPDF();
  
  const firstPr = prs[0];
  
  doc.setFontSize(18);
  doc.text('Procurement Purchase Order', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`PO No: ${firstPr.poNo}`, 14, 32);
  doc.text(`Date: ${firstPr.requestDate}`, 14, 38);
  doc.text(`Requested By: ${firstPr.requestedBy}`, 14, 44);

  const tableColumn = ["No", "Parts Deskripsi", "Unit", "Total Diterima", "Harga Satuan", "Total Harga"];
  const tableRows: (string | number)[][] = [];
  
  let grandTotal = 0;

  prs.forEach((pr, index) => {
    const total = pr.estimatedCost || 0;
    const unitPrice = total / (pr.quantity || 1);
    grandTotal += total;
    
    tableRows.push([
      (index + 1).toString(),
      pr.toolName,
      pr.unit,
      pr.quantity.toString(),
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(unitPrice),
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total)
    ]);
  });
  
  tableRows.push([
    "", "", "", "", "GRAND TOTAL",
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotal)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 52,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

export const generateProcurementRequisitionPDFBlob = (
  cartItems: ToolItem[],
  qtys: Record<string, number>,
  requestorName: string,
  poNo?: string
): string => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Procurement Requisition Form', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Requestor: ${requestorName}`, 14, 32);
  if (poNo) {
    doc.text(`PR No: ${poNo}`, 14, 38);
  }
  doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 14, poNo ? 44 : 38);

  const tableColumn = ["No", "Parts Deskripsi", "Kode", "Unit", "Total Dipesan", "Est. Biaya"];
  const tableRows: (string | number)[][] = [];
  
  let grandTotal = 0;

  cartItems.forEach((tool, index) => {
    const qty = qtys[tool.id] || 1;
    const price = tool.unitPrice || 50000;
    const total = price * qty;
    grandTotal += total;

    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total);

    tableRows.push([
      (index + 1).toString(),
      tool.name,
      tool.code,
      tool.unit,
      qty.toString(),
      formattedTotal
    ]);
  });
  
  // Add Grand Total row
  tableRows.push([
    "", "", "", "", "GRAND TOTAL",
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotal)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: poNo ? 52 : 46,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
