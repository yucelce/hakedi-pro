import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MeasurementSheet, ProjectInfo, CoverData } from '../types';

export const generateExcelReport = async (
  projectInfo: ProjectInfo,
  sheets: MeasurementSheet[],
  previousQuantities: Record<string, number>,
  coverData: CoverData
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hakediş Pro';
  workbook.created = new Date();

  // --- ORTAK STİL TANIMLAMALARI ---
  const fontNormal = { name: 'Arial', size: 10 };
  const fontBold = { name: 'Arial', size: 10, bold: true };
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
  };
  const alignmentCenter: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
  const alignmentLeft: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };
  
  const headerStyle = {
    font: { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } } as ExcelJS.FillPattern,
    alignment: alignmentCenter,
    border: borderThin
  };

  const numberFormat = '#,##0.00';
  const qtyFormat = '#,##0.000';

  // --- YARDIMCI FONKSİYONLAR ---
  const applyPageSetup = (ws: ExcelJS.Worksheet, orientation: 'portrait' | 'landscape' = 'portrait') => {
    ws.pageSetup.paperSize = 9; // A4
    ws.pageSetup.orientation = orientation;
    ws.pageSetup.margins = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
    ws.pageSetup.fitToPage = true;
    ws.pageSetup.fitToWidth = 1;
    ws.pageSetup.fitToHeight = 0; 
    ws.headerFooter.oddFooter = '&R Sayfa &P / &N';
    ws.headerFooter.oddHeader = `&L&10&B${projectInfo.projectName}&R&10${projectInfo.employer}`;
  };

  const addSignatures = (ws: ExcelJS.Worksheet, currentRow: number, numCols: number) => {
    const sigs = projectInfo.signatories || [];
    if (sigs.length === 0) return;
    
    currentRow += 3; // Boşluk bırak
    const titleRow = ws.getRow(currentRow);
    const nameRow = ws.getRow(currentRow + 3); // İmza için boşluk
    
    sigs.forEach((sig, i) => {
       // İmzaları sütunlara dengeli dağıt
       let col = 1;
       if (sigs.length > 1) {
           col = 1 + Math.floor(i * ((numCols - 1) / (sigs.length - 1)));
       }
       const tCell = titleRow.getCell(col);
       tCell.value = sig.title;
       tCell.font = fontBold;
       tCell.alignment = alignmentCenter;
       
       const nCell = nameRow.getCell(col);
       nCell.value = sig.name || '...................................';
       nCell.font = fontBold;
       nCell.alignment = alignmentCenter;
    });
  };

  // Sekme (Sayfa) isimlerini Excel standartlarına uygun hale getir
  const sheetSafeNames = sheets.map((s, i) => `${i + 1}-${s.code}`.replace(/[\\/?*[\]]/g, '').substring(0, 31));

  // ==========================================
  // 1. ADIM: ÖN KAPAK (SÖZLEŞME KÜNYESİ)
  // ==========================================
  const wsOnKapak = workbook.addWorksheet('Ön Kapak', { views: [{ showGridLines: false }] });
  applyPageSetup(wsOnKapak, 'portrait');
  wsOnKapak.columns = [{ width: 5 }, { width: 35 }, { width: 50 }, { width: 5 }];
  
  wsOnKapak.mergeCells('B2:C4');
  const titleCell = wsOnKapak.getCell('B2');
  titleCell.value = "HAKEDİŞ RAPORU VE\nEKLERİ DOSYASI";
  titleCell.font = { name: 'Arial', size: 24, bold: true };
  titleCell.alignment = alignmentCenter;
  
  let r = 7;
  const addInfo = (label: string, value: any, isCurrency = false) => {
      const lblCell = wsOnKapak.getCell(`B${r}`);
      const valCell = wsOnKapak.getCell(`C${r}`);
      lblCell.value = label;
      valCell.value = value || '-';
      lblCell.font = fontBold;
      valCell.font = fontBold;
      lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      lblCell.border = borderThin;
      valCell.border = borderThin;
      lblCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      if(isCurrency) valCell.numFmt = '#,##0.00 "₺"';
      wsOnKapak.getRow(r).height = 25;
      r++;
  };
  
  addInfo('İdare / İşveren Kurum', projectInfo.employer);
  addInfo('Yüklenici Firma', projectInfo.contractor);
  addInfo('İşin Adı', projectInfo.projectName);
  addInfo('İhale Kayıt No (İKN)', projectInfo.ikn);
  addInfo('Sözleşme Tarihi', projectInfo.contractDate ? new Date(projectInfo.contractDate).toLocaleDateString('tr-TR') : '-');
  addInfo('Yer Teslim Tarihi', projectInfo.siteDeliveryDate ? new Date(projectInfo.siteDeliveryDate).toLocaleDateString('tr-TR') : '-');
  addInfo('İşin Süresi', projectInfo.duration);
  addInfo('Sözleşme Bedeli', projectInfo.contractAmount, true);
  addInfo('Hakediş Dönemi / No', projectInfo.period);
  addInfo('Tanzim Tarihi', new Date(projectInfo.date).toLocaleDateString('tr-TR'));


  // ==========================================
  // 2. ADIM: ARKA KAPAK (HAKEDİŞ ÖZETİ)
  // ==========================================
  const wsKapak = workbook.addWorksheet('Arka Kapak', { views: [{ showGridLines: false }] });
  applyPageSetup(wsKapak, 'portrait');
  wsKapak.columns = [
    { header: 'AÇIKLAMA', key: 'desc', width: 45 },
    { header: 'KÜMÜLATİF', key: 'kum', width: 18 },
    { header: 'ÖNCEKİ', key: 'prev', width: 18 },
    { header: 'BU HAKEDİŞ', key: 'curr', width: 18 }
  ];
  wsKapak.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  
  let rowIdx = 2;
  // A) ÖDEMELER
  const rHeaderA = wsKapak.addRow(['A) ÖDEMELER']);
  rHeaderA.font = { name: 'Arial', size: 11, bold: true };
  rHeaderA.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  wsKapak.mergeCells(`A${rowIdx}:D${rowIdx}`);
  rowIdx++;
  
  const icmalTotalRow = sheets.length + 2; 
  const rowYapilan = wsKapak.addRow([
      '1. Yapılan İşler Tutarı',
      { formula: `='İcmal'!J${icmalTotalRow}` }, 
      { formula: `='İcmal'!H${icmalTotalRow}` }, 
      { formula: `='İcmal'!I${icmalTotalRow}` }, 
  ]);
  rowYapilan.font = fontBold;
  rowIdx++;
  
  const extraStart = rowIdx;
  coverData.extraPayments.forEach((ext, i) => {
     wsKapak.addRow([`${i+2}. ${ext.description}`, { formula: `C${rowIdx}+D${rowIdx}` }, ext.prevAmount, ext.currentAmount]);
     rowIdx++;
  });
  const extraEnd = rowIdx - 1;
  
  const rMatrah = wsKapak.addRow([
      'TOPLAM (Matrah)',
      { formula: `SUM(B${extraStart-1}:B${extraEnd})` },
      { formula: `SUM(C${extraStart-1}:C${extraEnd})` },
      { formula: `SUM(D${extraStart-1}:D${extraEnd})` },
  ]);
  const matrahRowIdx = rowIdx;
  rMatrah.font = fontBold;
  rMatrah.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } });
  rowIdx++;
  
  const rKdv = wsKapak.addRow([
      `KDV (%${coverData.kdvRate})`,
      { formula: `B${matrahRowIdx}*(${coverData.kdvRate}/100)` },
      { formula: `C${matrahRowIdx}*(${coverData.kdvRate}/100)` },
      { formula: `D${matrahRowIdx}*(${coverData.kdvRate}/100)` },
  ]);
  const kdvRowIdx = rowIdx;
  rKdv.font = fontBold;
  rowIdx++;
  
  const rFatura = wsKapak.addRow([
      'HAKEDİŞ FATURA TUTARI',
      { formula: `B${matrahRowIdx}+B${kdvRowIdx}` },
      { formula: `C${matrahRowIdx}+C${kdvRowIdx}` },
      { formula: `D${matrahRowIdx}+D${kdvRowIdx}` },
  ]);
  const faturaRowIdx = rowIdx;
  rFatura.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
  rFatura.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } });
  rowIdx++;
  
  wsKapak.addRow([]); rowIdx++;
  
  // B) KESİNTİLER
  const rHeaderB = wsKapak.addRow(['B) KESİNTİLER']);
  rHeaderB.font = { name: 'Arial', size: 11, bold: true };
  rHeaderB.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  wsKapak.mergeCells(`A${rowIdx}:D${rowIdx}`);
  rowIdx++;
  
  const dedStart = rowIdx;
  coverData.deductions.forEach((ded, i) => {
     wsKapak.addRow([`${i+1}. ${ded.description}`, { formula: `C${rowIdx}+D${rowIdx}` }, ded.prevAmount, ded.currentAmount]);
     rowIdx++;
  });
  const dedEnd = rowIdx - 1;
  
  const rDedTotal = wsKapak.addRow([
      'KESİNTİLER TOPLAMI',
      coverData.deductions.length ? { formula: `SUM(B${dedStart}:B${dedEnd})` } : 0,
      coverData.deductions.length ? { formula: `SUM(C${dedStart}:C${dedEnd})` } : 0,
      coverData.deductions.length ? { formula: `SUM(D${dedStart}:D${dedEnd})` } : 0,
  ]);
  const dedTotalRowIdx = rowIdx;
  rDedTotal.font = fontBold;
  rDedTotal.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } });
  rowIdx++;
  
  wsKapak.addRow([]); rowIdx++;
  
  // NET ÖDENECEK
  const rNet = wsKapak.addRow([
      'NET ÖDENECEK TUTAR',
      { formula: `B${faturaRowIdx}-B${dedTotalRowIdx}` },
      { formula: `C${faturaRowIdx}-C${dedTotalRowIdx}` },
      { formula: `D${faturaRowIdx}-D${dedTotalRowIdx}` },
  ]);
  rNet.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  rNet.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } });
  rNet.height = 30;
  
  wsKapak.eachRow((row, rn) => {
      if(rn > 1) {
          row.eachCell((cell, cn) => {
              if (cn > 1) cell.numFmt = numberFormat;
              if (row.getCell(1).value) cell.border = borderThin;
          });
      }
  });
  addSignatures(wsKapak, rowIdx, 4);


  // ==========================================
  // 3. ADIM: İCMAL
  // ==========================================
  const wsIcmal = workbook.addWorksheet('İcmal');
  applyPageSetup(wsIcmal, 'landscape');
  wsIcmal.columns = [
    { header: 'Poz No', width: 12 },
    { header: 'İşin Cinsi', width: 45 },
    { header: 'Birim', width: 8 },
    { header: 'Birim Fiyat', width: 14 },
    { header: 'Önceki Metraj', width: 14 },
    { header: 'Bu Hakediş', width: 14 },
    { header: 'Toplam Metraj', width: 14 },
    { header: 'Önceki Tutar', width: 15 },
    { header: 'Bu Hakediş Tutar', width: 15 },
    { header: 'Toplam Tutar', width: 15 }
  ];
  wsIcmal.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  
  let iRow = 2;
  sheets.forEach((sheet, idx) => {
      const gbRow = idx + 2; 
      const row = wsIcmal.addRow([
          sheet.code,
          sheet.groupName,
          sheet.unit,
          sheet.unitPrice,
          { formula: `='Yeşil Defter'!E${gbRow}` }, 
          { formula: `='Yeşil Defter'!F${gbRow}` }, 
          { formula: `='Yeşil Defter'!D${gbRow}` }, 
          { formula: `D${iRow}*E${iRow}` }, 
          { formula: `D${iRow}*F${iRow}` }, 
          { formula: `D${iRow}*G${iRow}` }  
      ]);
      row.eachCell(c => c.border = borderThin);
      row.font = fontNormal;
      row.getCell(4).numFmt = numberFormat;
      row.getCell(5).numFmt = qtyFormat;
      row.getCell(6).numFmt = qtyFormat;
      row.getCell(6).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF059669' } };
      row.getCell(7).numFmt = qtyFormat;
      row.getCell(8).numFmt = numberFormat;
      row.getCell(9).numFmt = numberFormat;
      row.getCell(9).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0284C7' } };
      row.getCell(10).numFmt = numberFormat;
      iRow++;
  });
  
  const iTotRow = wsIcmal.addRow(['', '', '', 'TOPLAM:', '', '', '', { formula: `SUM(H2:H${iRow-1})` }, { formula: `SUM(I2:I${iRow-1})` }, { formula: `SUM(J2:J${iRow-1})` }]);
  iTotRow.eachCell(c => { c.border = borderThin; c.font = fontBold; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; });
  iTotRow.getCell(8).numFmt = numberFormat;
  iTotRow.getCell(9).numFmt = numberFormat;
  iTotRow.getCell(10).numFmt = numberFormat;
  addSignatures(wsIcmal, iRow + 1, 10);


  // ==========================================
  // 4. ADIM: YEŞİL DEFTER
  // ==========================================
  const wsYesil = workbook.addWorksheet('Yeşil Defter');
  applyPageSetup(wsYesil, 'portrait');
  wsYesil.columns = [
    { header: 'Poz No', width: 12 },
    { header: 'Açıklama / İmalat Yeri', width: 45 },
    { header: 'Birim', width: 10 },
    { header: 'Kümülatif', width: 15 },
    { header: 'Önceki Metraj', width: 15 },
    { header: 'Bu Hakediş', width: 15 }
  ];
  wsYesil.getRow(1).eachCell(c => Object.assign(c, headerStyle));
  
  let yRow = 2;
  sheets.forEach((sheet, index) => {
      const prevQty = previousQuantities[sheet.id] || 0;
      const safeName = sheetSafeNames[index];
      const mTotalRow = sheet.measurements.length + 3; // Metraj sekmesindeki toplam satırı
      
      const row = wsYesil.addRow([
          sheet.code,
          `${sheet.groupName} (${sheet.description})`,
          sheet.unit,
          { formula: `='${safeName}'!G${mTotalRow}` }, 
          prevQty,
          { formula: `D${yRow}-E${yRow}` }
      ]);
      row.eachCell(c => c.border = borderThin);
      row.font = fontNormal;
      row.getCell(4).numFmt = qtyFormat;
      row.getCell(5).numFmt = qtyFormat;
      row.getCell(6).numFmt = qtyFormat;
      row.getCell(6).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF059669' } };
      yRow++;
  });
  addSignatures(wsYesil, yRow + 1, 6);


  // ==========================================
  // 5. ADIM: METRAJ CETVELLERİ
  // ==========================================
  sheets.forEach((sheet, index) => {
      const safeName = sheetSafeNames[index];
      const wsM = workbook.addWorksheet(safeName);
      applyPageSetup(wsM, 'portrait');
      
      // Özel Başlık Alanı
      wsM.mergeCells('A1:G1');
      const h1 = wsM.getCell('A1');
      h1.value = `${index + 1}. ${sheet.groupName} (${sheet.description}) - POZ: ${sheet.code}`;
      h1.font = { name: 'Arial', size: 11, bold: true };
      h1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      h1.border = borderThin;
      h1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      
      wsM.columns = [
        { key: 'desc', width: 40 }, 
        { key: 'dim1', width: 10 }, 
        { key: 'dim2', width: 10 }, 
        { key: 'dim3', width: 10 }, 
        { key: 'count', width: 10 }, 
        { key: 'minha', width: 8 }, 
        { key: 'total', width: 15 } 
      ];
      
      const r2 = wsM.getRow(2);
      r2.values = ['Açıklama / İmalat Yeri', sheet.type === 'rebar' ? 'Çap (Ø)' : 'En', sheet.type === 'rebar' ? 'Boy (L)' : 'Boy', sheet.type === 'rebar' ? 'B.Ağır.' : 'Yükseklik', 'Adet', '-', sheet.type === 'rebar' ? 'Ağırlık' : 'Miktar'];
      r2.eachCell(c => Object.assign(c, headerStyle));
      
      let mRow = 3;
      sheet.measurements.forEach(m => {
          const row = wsM.addRow([
             m.description,
             sheet.type === 'rebar' ? m.diameter : m.width,
             sheet.type === 'rebar' ? m.length : m.length,
             sheet.type === 'rebar' ? m.unitWeight : m.height,
             m.count,
             m.count < 0 ? 'Minha' : '',
             0 
          ]);
          
          const formulaStr = sheet.type === 'rebar' 
              ? `IF(ISBLANK(B${mRow}),0,B${mRow}^2/162)*IF(ISBLANK(C${mRow}),0,C${mRow})*E${mRow}` 
              : `IF(ISBLANK(B${mRow}),1,B${mRow}) * IF(ISBLANK(C${mRow}),1,C${mRow}) * IF(ISBLANK(D${mRow}),1,D${mRow}) * E${mRow}`;
              
          row.getCell(7).value = { formula: formulaStr, result: m.subtotal };
          row.eachCell(c => { c.border = borderThin; c.font = fontNormal; c.alignment = alignmentCenter; });
          row.getCell(1).alignment = alignmentLeft;
          row.getCell(7).numFmt = qtyFormat;
          
          if(m.count < 0) {
              row.getCell(7).font = { color: { argb: 'FFDC2626' }, ...fontNormal };
          }
          mRow++;
      });
      
      const rTot = wsM.addRow(['', '', '', '', '', 'TOPLAM:', { formula: `SUM(G3:G${mRow-1})` }]);
      rTot.eachCell(c => { c.font = fontBold; c.border = borderThin; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; });
      rTot.getCell(7).numFmt = qtyFormat;
      
      addSignatures(wsM, mRow + 2, 7);
  });

  // Varsayılan olarak Ön Kapak sekmesi açılsın
  workbook.views = [{ activeTab: 0 }];

  // ==========================================
  // 6. ADIM: DOSYAYI KAYDET VE İNDİR
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `${projectInfo.projectName.replace(/\s+/g, '_')}_Hakedis.xlsx`;
  
  saveAs(blob, fileName);
};