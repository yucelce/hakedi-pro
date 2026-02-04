import React from 'react';
import { WorkItem, ProjectInfo } from '../types';
import { calculateItemCurrentQuantity, calculateMeasurementTotal, formatNumber, formatCurrency } from '../utils';

interface PrintReportProps {
  items: WorkItem[];
  projectInfo: ProjectInfo;
}

export const PrintReport: React.FC<PrintReportProps> = ({ items, projectInfo }) => {
  
  // Calculate Grand Totals
  const totalAmount = items.reduce((acc, item) => {
    const currentQty = calculateItemCurrentQuantity(item);
    return acc + (currentQty * item.unitPrice);
  }, 0);

  const kdv = totalAmount * 0.20;
  const grandTotal = totalAmount + kdv;

  const ReportHeader = ({ title }: { title: string }) => (
    <div className="mb-6 border-b-2 border-gray-800 pb-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold uppercase text-gray-900">{projectInfo.projectName}</h1>
          <p className="text-gray-600">{projectInfo.contractor}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">{projectInfo.period}</h2>
          <p className="text-gray-500">{new Date(projectInfo.date).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-xl font-bold uppercase border-2 border-gray-800 inline-block px-6 py-1">{title}</h3>
      </div>
    </div>
  );

  const SignatureBlock = () => (
    <div className="mt-20 flex justify-between px-10 text-center break-inside-avoid">
      <div className="border-t border-black pt-2 w-64">
        <p className="font-bold">YÜKLENİCİ</p>
        <p className="text-sm mt-8">(İmza / Kaşe)</p>
      </div>
      <div className="border-t border-black pt-2 w-64">
        <p className="font-bold">KONTROL TEŞKİLATI</p>
        <p className="text-sm mt-8">(İmza / Onay)</p>
      </div>
    </div>
  );

  return (
    <div className="print-container bg-white text-black font-serif text-sm w-[210mm] mx-auto">
      
      {/* 1. SAYFA: METRAJ CETVELİ */}
      <div className="p-8 bg-white min-h-[297mm] shadow-lg print:shadow-none mb-8 print:mb-0">
        <ReportHeader title="METRAJ CETVELİ" />
        
        <div className="space-y-6">
          {items.map((item) => {
             const itemTotal = calculateItemCurrentQuantity(item);
             if (itemTotal === 0 && (!item.sheets || item.sheets.length === 0)) return null;

             return (
              <div key={item.id} className="break-inside-avoid mb-4">
                <div className="bg-gray-100 p-2 border border-black font-bold flex justify-between">
                  <span>{item.code} - {item.description}</span>
                  <span>Birim: {item.unit}</span>
                </div>
                <table className="w-full border-collapse border-x border-b border-black text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-r border-b border-black px-2 py-1 w-1/3 text-left">Açıklama</th>
                      <th className="border-r border-b border-black px-2 py-1 w-16 text-right">En</th>
                      <th className="border-r border-b border-black px-2 py-1 w-16 text-right">Boy</th>
                      <th className="border-r border-b border-black px-2 py-1 w-16 text-right">Yük.</th>
                      <th className="border-r border-b border-black px-2 py-1 w-12 text-right">Adet</th>
                      <th className="border-b border-black px-2 py-1 w-24 text-right">Ara Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.sheets?.map((sheet) => (
                      <React.Fragment key={sheet.id}>
                        {/* Optional Sub-header for Sheet Name if needed, or just list measurements */}
                        <tr className="bg-gray-50 italic">
                           <td colSpan={6} className="border-x border-black px-2 py-1 text-gray-600 font-semibold">{sheet.name}</td>
                        </tr>
                        {sheet.measurements.map((m) => (
                          <tr key={m.id}>
                            <td className="border-r border-gray-300 px-2 py-1">{m.description}</td>
                            <td className="border-r border-gray-300 px-2 py-1 text-right">{m.width ?? '-'}</td>
                            <td className="border-r border-gray-300 px-2 py-1 text-right">{m.length ?? '-'}</td>
                            <td className="border-r border-gray-300 px-2 py-1 text-right">{m.height ?? '-'}</td>
                            <td className="border-r border-gray-300 px-2 py-1 text-right">{m.count}</td>
                            <td className="px-2 py-1 text-right">{formatNumber(calculateMeasurementTotal(m))}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={5} className="border-t border-r border-black px-2 py-1 text-right">TOPLAM</td>
                      <td className="border-t border-black px-2 py-1 text-right">{formatNumber(itemTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SAYFA: HAKEDİŞ ÖZETİ (Page Break Before) */}
      <div className="print-break-before p-8 bg-white min-h-[297mm] shadow-lg print:shadow-none mb-8 print:mb-0">
        <ReportHeader title="HAKEDİŞ ÖZETİ (YEŞİL DEFTER)" />
        
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 text-center font-bold">
              <th className="border border-black p-2 w-12">Sıra</th>
              <th className="border border-black p-2 w-20">Poz No</th>
              <th className="border border-black p-2 text-left">İşin Tanımı</th>
              <th className="border border-black p-2 w-12">Birim</th>
              <th className="border border-black p-2 w-24">Birim Fiyat</th>
              <th className="border border-black p-2 w-20">Önceki Miktar</th>
              <th className="border border-black p-2 w-20">Bu Dönem Miktar</th>
              <th className="border border-black p-2 w-24">Toplam Miktar</th>
              <th className="border border-black p-2 w-28">Bu Dönem Tutarı</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const currentQty = calculateItemCurrentQuantity(item);
              const currentAmount = currentQty * item.unitPrice;
              const totalQty = item.previousQuantity + currentQty;

              return (
                <tr key={item.id} className="text-right hover:bg-gray-50">
                  <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1 text-center font-semibold">{item.code}</td>
                  <td className="border border-black px-2 py-1 text-left">{item.description}</td>
                  <td className="border border-black px-2 py-1 text-center">{item.unit}</td>
                  <td className="border border-black px-2 py-1">{formatCurrency(item.unitPrice)}</td>
                  <td className="border border-black px-2 py-1">{formatNumber(item.previousQuantity)}</td>
                  <td className="border border-black px-2 py-1 font-bold">{formatNumber(currentQty)}</td>
                  <td className="border border-black px-2 py-1 bg-gray-50">{formatNumber(totalQty)}</td>
                  <td className="border border-black px-2 py-1 font-bold">{formatCurrency(currentAmount)}</td>
                </tr>
              );
            })}
            {/* Grand Total Row for Summary Table */}
             <tr className="bg-gray-100 font-bold text-right text-sm">
                <td colSpan={8} className="border border-black p-2">TOPLAM BU DÖNEM İMALATI</td>
                <td className="border border-black p-2">{formatCurrency(totalAmount)}</td>
             </tr>
          </tbody>
        </table>
        
        <SignatureBlock />
      </div>

      {/* 3. SAYFA: FİNANSAL İCMAL (Page Break Before) */}
      <div className="print-break-before p-8 bg-white min-h-[297mm] shadow-lg print:shadow-none flex flex-col justify-between">
        <div>
          <ReportHeader title="FİNANSAL İCMAL (ARKA KAPAK)" />
          
          <div className="mt-12 max-w-2xl mx-auto border-2 border-black p-1">
            <div className="border border-black p-8 space-y-4">
              
              <div className="flex justify-between items-center text-lg pb-4 border-b border-dashed border-gray-400">
                <span className="font-semibold text-gray-700">İmalat Tutarı (KDV Hariç)</span>
                <span className="font-bold text-xl">{formatCurrency(totalAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center text-lg pb-4 border-b border-black">
                <span className="font-semibold text-gray-700">KDV (%20)</span>
                <span className="font-bold text-xl">{formatCurrency(kdv)}</span>
              </div>
              
              <div className="flex justify-between items-center text-xl pt-4">
                <span className="font-bold uppercase">Toplam Tahakkuk</span>
                <span className="font-extrabold text-2xl bg-yellow-100 px-4 py-1 border border-black">{formatCurrency(grandTotal)}</span>
              </div>

            </div>
          </div>
          
          <div className="mt-12 text-center text-gray-500 italic">
            <p>Yalnız; {formatCurrency(grandTotal)} ödenmesi uygundur.</p>
          </div>
        </div>

        <SignatureBlock />
      </div>

    </div>
  );
};