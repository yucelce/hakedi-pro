import React, { useMemo } from 'react';
import { MeasurementSheet, ProjectInfo, CoverData } from '../types';
import { calculateMeasurementRow, formatNumber, formatCurrency } from '../utils';
import { Download, Printer } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface Props {
  sheets: MeasurementSheet[];
  projectInfo: ProjectInfo;
  previousQuantities: Record<string, number>;
  coverData: CoverData;
}

export const PrintReport: React.FC<Props> = ({ sheets, projectInfo, previousQuantities, coverData }) => {

  // --- HESAPLAMALAR ---
  const workDone = useMemo(() => {
    let totalGeneral = 0;
    let totalPrev = 0;
    sheets.forEach(sheet => {
      totalGeneral += sheet.totalAmount * sheet.unitPrice;
      const prevQty = previousQuantities[sheet.code] || 0;
      totalPrev += prevQty * sheet.unitPrice;
    });
    return { general: totalGeneral, prev: totalPrev, current: totalGeneral - totalPrev };
  }, [sheets, previousQuantities]);

  const extraTotals = useMemo(() => {
    let prev = 0, current = 0;
    coverData.extraPayments.forEach(item => {
      prev += item.prevAmount || 0;
      current += item.currentAmount || 0;
    });
    return { prev, current, general: prev + current };
  }, [coverData.extraPayments]);

  const deductionTotals = useMemo(() => {
    let prev = 0, current = 0;
    coverData.deductions.forEach(item => {
      prev += item.prevAmount || 0;
      current += item.currentAmount || 0;
    });
    return { prev, current, general: prev + current };
  }, [coverData.deductions]);

  const totalAmountA = {
    prev: workDone.prev + extraTotals.prev,
    current: workDone.current + extraTotals.current,
    general: workDone.general + extraTotals.general
  };

  const kdvAmount = {
    prev: totalAmountA.prev * (coverData.kdvRate / 100),
    current: totalAmountA.current * (coverData.kdvRate / 100),
    general: totalAmountA.general * (coverData.kdvRate / 100)
  };

  const invoiceAmount = {
    prev: totalAmountA.prev + kdvAmount.prev,
    current: totalAmountA.current + kdvAmount.current,
    general: totalAmountA.general + kdvAmount.general
  };

  const netPayable = {
    prev: invoiceAmount.prev - deductionTotals.prev,
    current: invoiceAmount.current - deductionTotals.current,
    general: invoiceAmount.general - deductionTotals.general
  };

  // --- DETAYLI İCMAL VERİSİ ---
  const detailedGroupedData = useMemo(() => {
    const groups: Record<string, any> = {};
    
    sheets.forEach(sheet => {
      if (!groups[sheet.code]) {
        groups[sheet.code] = {
          code: sheet.code,
          description: sheet.description || sheet.groupName,
          unit: sheet.unit,
          unitPrice: sheet.unitPrice,
          totalQty: 0
        };
      }
      groups[sheet.code].totalQty += sheet.totalAmount;
    });

    return Object.values(groups).map((item: any) => {
      const prevQty = previousQuantities[item.code] || 0;
      const currentQty = item.totalQty - prevQty;
      
      return {
        ...item,
        prevQty,
        currentQty,
        prevAmount: prevQty * item.unitPrice,
        currentAmount: currentQty * item.unitPrice,
        totalAmount: item.totalQty * item.unitPrice
      };
    });
  }, [sheets, previousQuantities]);

  const grandTotalAmount = detailedGroupedData.reduce((acc, item) => acc + item.totalAmount, 0);
  const totalPrevAmount = detailedGroupedData.reduce((acc, item) => acc + item.prevAmount, 0);
  const totalCurrentAmount = detailedGroupedData.reduce((acc, item) => acc + item.currentAmount, 0);

  // Toplam Sayfa Sayısı
  const totalPages = 3 + sheets.length;

 // --- PDF İNDİRME FONKSİYONU ---
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-container');
    
    const opt = {
      margin:       [5, 0, 5, 0], // Dikey margin ekledik, taşmaları önler
      filename:     `${projectInfo.projectName.replace(/\s+/g, '_')}_Hakedis.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, // 4 yerine 2 yaptım, boyut düşer ama render hızlanır ve hata azalır
        useCORS: true, 
        letterRendering: true,
        scrollY: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'css', avoid: '.avoid-break' } // Otomatik yerine CSS kontrolü
    };

    html2pdf().set(opt).from(element).save();
  };

  // --- BİLEŞENLER ---
  const Header = ({ title }: { title: string }) => (
    <div className="border-b-2 border-gray-800 pb-2 mb-6 avoid-break">
      <div className="flex justify-between uppercase font-bold text-xs">
        <div>
          <h1 className="text-sm md:text-base">{projectInfo.projectName}</h1>
          <p className="text-gray-600 text-xs">{projectInfo.contractor}</p>
        </div>
        <div className="text-right">
          <h2>{projectInfo.period}</h2>
          <p className="text-xs">{new Date(projectInfo.date).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
      <div className="text-center mt-4">
        <span className="border-2 border-gray-800 px-6 py-2 font-bold text-base rounded bg-gray-50 uppercase tracking-widest">
          {title}
        </span>
      </div>
    </div>
  );

  const SignatureBlock = () => (
    <div className="grid grid-cols-3 gap-4 mt-auto pt-10 px-4 text-center signature-block avoid-break">
      {(projectInfo.signatories || []).map((sig, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="w-full border-b border-black pb-1 mb-6 min-h-[20px] flex items-end justify-center">
            <p className="font-bold uppercase text-[10px]">{sig.title}</p>
          </div>
          <p className="text-[10px]">{sig.name || '...................'}</p>
        </div>
      ))}
    </div>
  );

  const PageNumber = ({ current }: { current: number }) => (
    <div className="absolute bottom-8 right-10 text-[10px] text-gray-500 font-mono no-print-hide">
      {current} / {totalPages}
    </div>
  );

  return (
    <div className="w-full bg-gray-100 print:bg-white font-serif text-black relative">
      
      {/* İNDİRME BUTONU */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 no-print" data-html2canvas-ignore="true">
        <div className="bg-slate-800 text-white text-xs py-1 px-3 rounded opacity-80 mb-1">
           Çıktı için önerilir 👇
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold transition transform hover:scale-105"
        >
          <Download size={24} /> PDF OLARAK İNDİR
        </button>
      </div>
      
      {/* RAPOR KAPSAYICISI */}
      <div id="report-container">
        
        {/* SAYFA 1: ÖN KAPAK */}
        <div className="report-page flex flex-col justify-center items-center text-center relative">
          <h1 className="text-4xl font-bold mb-20 tracking-widest border-b-4 border-gray-900 pb-4">HAKEDİŞ RAPORU</h1>
          <div className="w-full max-w-lg space-y-8 text-left">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">PROJE ADI</p>
              <p className="text-lg font-bold border-b border-gray-300 pb-2">{projectInfo.projectName}</p>
            </div>
             {/* İŞVEREN EKLENDİ */}
             <div>
              <p className="text-xs text-gray-500 font-bold mb-1">İDARE / İŞVEREN</p>
              <p className="text-lg font-bold border-b border-gray-300 pb-2">{projectInfo.employer || 'Belirtilmedi'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">YÜKLENİCİ FİRMA</p>
              <p className="text-lg font-bold border-b border-gray-300 pb-2">{projectInfo.contractor}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold mb-1">HAKEDİŞ DÖNEMİ</p>
              <p className="text-lg font-bold border-b border-gray-300 pb-2">{projectInfo.period}</p>
            </div>
          </div>
          <PageNumber current={1} />
        </div>

        {/* SAYFA 2: ARKA KAPAK (DETAYLANDIRILDI) */}
        <div className="report-page flex flex-col relative">
          <Header title="HAKEDİŞ ARKA KAPAĞI" />
          <div className="border-2 border-black text-[11px]">
            <div className="grid grid-cols-12 bg-gray-200 font-bold border-b border-black text-center">
              <div className="col-span-4 p-2 border-r border-black">AÇIKLAMA</div>
              <div className="col-span-2 p-2 border-r border-black">GENEL TOPLAM</div>
              <div className="col-span-3 p-2 border-r border-black">ÖNCEKİ</div>
              <div className="col-span-3 p-2">BU HAKEDİŞ</div>
            </div>

            {/* A) ÖDEMELER */}
            <div className="bg-gray-100 font-bold p-1 border-b border-black text-center text-[10px]">A) ÖDEMELER</div>

            <div className="grid grid-cols-12 border-b border-gray-300 font-bold">
              <div className="col-span-4 p-2 border-r border-black">1. Yapılan İşler Tutarı</div>
              <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(workDone.general)}</div>
              <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(workDone.prev)}</div>
              <div className="col-span-3 p-2 text-right">{formatNumber(workDone.current)}</div>
            </div>
            {/* Ek Ödemeler */}
            {coverData.extraPayments.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 border-b border-gray-300">
                   <div className="col-span-4 p-1 pl-4 border-r border-black flex">
                      <span className="mr-1">{idx + 2}.</span> {row.description}
                   </div>
                   <div className="col-span-2 p-1 border-r border-black text-right text-gray-600">
                      {formatNumber((row.prevAmount||0) + (row.currentAmount||0))}
                   </div>
                   <div className="col-span-3 p-1 border-r border-black text-right text-gray-600">
                      {formatNumber(row.prevAmount)}
                   </div>
                   <div className="col-span-3 p-1 text-right font-bold">
                      {formatNumber(row.currentAmount)}
                   </div>
                </div>
             ))}
            
            {/* TOPLAM A */}
            <div className="grid grid-cols-12 border-b border-gray-400 font-bold bg-gray-50">
               <div className="col-span-4 p-2 border-r border-black text-right pr-2">TOPLAM (Matrah) :</div>
               <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(totalAmountA.general)}</div>
               <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(totalAmountA.prev)}</div>
               <div className="col-span-3 p-2 text-right">{formatNumber(totalAmountA.current)}</div>
            </div>

             {/* KDV */}
            <div className="grid grid-cols-12 border-b border-black">
               <div className="col-span-4 p-2 border-r border-black text-right pr-2">KDV (%{coverData.kdvRate}) :</div>
               <div className="col-span-2 p-2 border-r border-black text-right text-gray-600">{formatNumber(kdvAmount.general)}</div>
               <div className="col-span-3 p-2 border-r border-black text-right text-gray-600">{formatNumber(kdvAmount.prev)}</div>
               <div className="col-span-3 p-2 text-right text-gray-600">{formatNumber(kdvAmount.current)}</div>
            </div>

             {/* FATURA TUTARI */}
            <div className="grid grid-cols-12 border-b-2 border-black font-bold bg-blue-50">
               <div className="col-span-4 p-2 border-r border-black text-right pr-2">FATURA TUTARI :</div>
               <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(invoiceAmount.general)}</div>
               <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(invoiceAmount.prev)}</div>
               <div className="col-span-3 p-2 text-right text-blue-900">{formatNumber(invoiceAmount.current)}</div>
            </div>

             {/* B) KESİNTİLER */}
            <div className="bg-gray-100 font-bold p-1 border-b border-black text-center text-[10px]">B) KESİNTİLER</div>
            
            {coverData.deductions.length === 0 && (
               <div className="p-2 text-center text-gray-400 italic text-[9px] border-b border-black">Kesinti yok</div>
            )}

            {coverData.deductions.map((row, idx) => (
               <div key={idx} className="grid grid-cols-12 border-b border-gray-300">
                  <div className="col-span-4 p-1 pl-4 border-r border-black flex">
                     <span className="mr-1">{idx + 1}.</span> {row.description}
                  </div>
                  <div className="col-span-2 p-1 border-r border-black text-right text-gray-600">
                     {formatNumber((row.prevAmount||0) + (row.currentAmount||0))}
                  </div>
                  <div className="col-span-3 p-1 border-r border-black text-right text-gray-600">
                     {formatNumber(row.prevAmount)}
                  </div>
                  <div className="col-span-3 p-1 text-right text-red-700">
                     {formatNumber(row.currentAmount)}
                  </div>
               </div>
            ))}

            <div className="grid grid-cols-12 bg-emerald-100 font-bold text-sm border-t-2 border-black">
              <div className="col-span-4 p-3 border-r border-black text-right">NET ÖDENECEK:</div>
              <div className="col-span-8 p-3 text-right text-emerald-900">{formatCurrency(netPayable.current)}</div>
            </div>
          </div>
          <SignatureBlock />
          <PageNumber current={2} />
        </div>

        {/* SAYFA 3: İCMAL (DETAYLANDIRILDI) */}
        <div className="report-page flex flex-col relative">
          <Header title="HAKEDİŞ ÖZETİ (İCMAL)" />
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th rowSpan={2} className="border border-black p-1 w-10">Poz</th>
                <th rowSpan={2} className="border border-black p-1">İşin Tanımı</th>
                <th rowSpan={2} className="border border-black p-1 w-8">Birim</th>
                <th rowSpan={2} className="border border-black p-1 w-12">B.Fiyat</th>
                <th colSpan={3} className="border border-black p-1 bg-blue-50">Miktar</th>
                <th colSpan={3} className="border border-black p-1 bg-emerald-50">Tutar (TL)</th>
              </tr>
              <tr className="bg-gray-100 font-bold text-center text-[8px]">
                <th className="border border-black p-1">Önceki</th>
                <th className="border border-black p-1">Bu Dönem</th>
                <th className="border border-black p-1">Toplam</th>
                <th className="border border-black p-1">Önceki</th>
                <th className="border border-black p-1">Bu Dönem</th>
                <th className="border border-black p-1">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {detailedGroupedData.map((item: any) => (
                <tr key={item.code} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-center font-bold">{item.code}</td>
                  <td className="border border-black p-1 truncate max-w-[150px]">{item.description}</td>
                  <td className="border border-black p-1 text-center">{item.unit}</td>
                  <td className="border border-black p-1 text-right">{formatNumber(item.unitPrice, 2)}</td>
                  
                  {/* MİKTARLAR */}
                  <td className="border border-black p-1 text-right text-gray-500">{formatNumber(item.prevQty, 2)}</td>
                  <td className="border border-black p-1 text-right font-bold text-blue-800">{formatNumber(item.currentQty, 2)}</td>
                  <td className="border border-black p-1 text-right font-semibold">{formatNumber(item.totalQty, 2)}</td>

                  {/* TUTARLAR */}
                  <td className="border border-black p-1 text-right text-gray-500">{formatNumber(item.prevAmount, 2)}</td>
                  <td className="border border-black p-1 text-right font-bold text-emerald-800">{formatNumber(item.currentAmount, 2)}</td>
                  <td className="border border-black p-1 text-right font-semibold">{formatNumber(item.totalAmount, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className="bg-gray-800 text-white font-bold">
                  <td colSpan={7} className="p-2 text-right">GENEL TOPLAM:</td>
                  <td className="p-2 text-right border-l border-white text-[9px]">{formatNumber(totalPrevAmount)}</td>
                  <td className="p-2 text-right border-l border-white text-[9px]">{formatNumber(totalCurrentAmount)}</td>
                  <td className="p-2 text-right border-l border-white text-[9px]">{formatNumber(grandTotalAmount)}</td>
               </tr>
            </tfoot>
          </table>
          <SignatureBlock />
          <PageNumber current={3} />
        </div>

        {/* SAYFA 4 VE SONRASI: METRAJ CETVELLERİ */}
        {sheets.map((sheet, index) => (
          <div key={sheet.id} className="report-page flex flex-col relative">
            <Header title="METRAJ CETVELİ" />
            <div className="bg-gray-100 p-2 border border-black mb-2 font-bold text-[10px] flex justify-between">
              <span>{index + 1}. {sheet.groupName}</span>
              <span>Poz: {sheet.code}</span>
            </div>
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-black p-1 text-left">Açıklama</th>
                  <th className="border border-black p-1 text-center w-12">En</th>
                  <th className="border border-black p-1 text-center w-12">Boy</th>
                  <th className="border border-black p-1 text-center w-12">Yük.</th>
                  <th className="border border-black p-1 text-center w-12">Adet</th>
                  <th className="border border-black p-1 text-right w-20">Miktar</th>
                </tr>
              </thead>
              <tbody>
                {sheet.measurements.map((m) => (
                  <tr key={m.id}>
                    <td className="border border-black p-1">{m.description}</td>
                    <td className="border border-black p-1 text-center text-gray-500">{m.width ? formatNumber(m.width) : '-'}</td>
                    <td className="border border-black p-1 text-center text-gray-500">{m.length ? formatNumber(m.length) : '-'}</td>
                    <td className="border border-black p-1 text-center text-gray-500">{m.height ? formatNumber(m.height) : '-'}</td>
                    <td className="border border-black p-1 text-center font-bold">{formatNumber(m.count)}</td>
                    <td className="border border-black p-1 text-right font-mono">{formatNumber(calculateMeasurementRow(m), 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={5} className="border border-black p-1 text-right">TOPLAM:</td>
                  <td className="border border-black p-1 text-right">{formatNumber(sheet.totalAmount, 2)} {sheet.unit}</td>
                </tr>
              </tfoot>
            </table>
            <SignatureBlock />
            <PageNumber current={4 + index} />
          </div>
        ))}
      </div>
    </div>
  );
};