import React, { useMemo } from 'react';
import { MeasurementSheet, ProjectInfo } from '../types';
import { calculateMeasurementRow, formatNumber, formatCurrency } from '../utils';

interface Props {
  sheets: MeasurementSheet[];
  projectInfo: ProjectInfo;
  previousQuantities: Record<string, number>;
}

export const PrintReport: React.FC<Props> = ({ sheets, projectInfo, previousQuantities }) => {

  // --- HESAPLAMALAR ---
  const groupedData = useMemo(() => {
    const groups: Record<string, {
      code: string;
      description: string;
      unit: string;
      unitPrice: number;
      totalQty: number;
    }> = {};

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

    return Object.values(groups);
  }, [sheets]);

  const grandTotalAmount = groupedData.reduce((acc, item) => {
    const prevQty = previousQuantities[item.code] || 0;
    const currentQty = item.totalQty - prevQty;
    return acc + (currentQty * item.unitPrice);
  }, 0);

  // --- HEADER BİLEŞENİ ---
  const Header = ({ title }: { title: string }) => (
    <div className="border-b-2 border-gray-800 pb-2 mb-4 break-inside-avoid">
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
      <div className="text-center mt-2">
        <span className="border border-gray-800 px-4 py-1 font-bold text-sm rounded bg-gray-50">
          {title}
        </span>
      </div>
    </div>
  );

  return (
    // width ve padding ayarları güncellendi
    <div className="bg-white w-full print:w-full max-w-[210mm] mx-auto p-8 print:p-0 text-black font-serif text-xs md:text-sm">
      
      {/* --------------------------------------------------------- */}
      {/* BÖLÜM 1: DETAYLI METRAJ CETVELLERİ */}
      {/* --------------------------------------------------------- */}
      <div className="print:mb-0">
        <Header title="METRAJ CETVELİ" />
        
        <div className="space-y-6">
          {sheets.map((sheet, index) => (
            // break-inside-avoid: Tablo bölünmesin
            <div key={sheet.id} className="break-inside-avoid border border-black mb-4 print:mb-4">
              <div className="bg-gray-200 border-b border-black p-1.5 flex justify-between font-bold text-xs">
                <span>{index + 1}. {sheet.groupName}</span>
                <span>Poz: {sheet.code}</span>
              </div>
              
              <table className="w-full text-xs border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border-r border-black p-1 text-left w-[40%]">Açıklama</th>
                    <th className="border-r border-black p-1 w-[12%]">En</th>
                    <th className="border-r border-black p-1 w-[12%]">Boy</th>
                    <th className="border-r border-black p-1 w-[12%]">Yük.</th>
                    <th className="border-r border-black p-1 w-[8%]">Adet</th>
                    <th className="p-1 w-[16%] text-right">Miktar</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.measurements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-300">
                      <td className="border-r border-black p-1 truncate">{m.description}</td>
                      <td className="border-r border-black p-1 text-center">{formatNumber(m.width)}</td>
                      <td className="border-r border-black p-1 text-center">{formatNumber(m.length)}</td>
                      <td className="border-r border-black p-1 text-center">{formatNumber(m.height)}</td>
                      <td className="border-r border-black p-1 text-center font-bold">{formatNumber(m.count)}</td>
                      <td className="p-1 text-right font-mono">{formatNumber(calculateMeasurementRow(m))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={5} className="border-t border-r border-black p-1 text-right">TOPLAM ({sheet.unit}):</td>
                    <td className="border-t border-black p-1 text-right">{formatNumber(sheet.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Sayfa Kesme: Her zaman yeni sayfaya geç */}
      <div className="print-break-before block h-4"></div>

      {/* --------------------------------------------------------- */}
      {/* BÖLÜM 2: YEŞİL DEFTER (HAKEDİŞ ÖZETİ) */}
      {/* --------------------------------------------------------- */}
      <div>
        <Header title="YEŞİL DEFTER (İCMAL)" />
        
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-200 font-bold text-center border-b border-black">
              <th className="border-r border-black p-1.5">Poz No</th>
              <th className="border-r border-black p-1.5">İşin Tanımı</th>
              <th className="border-r border-black p-1.5">Birim</th>
              <th className="border-r border-black p-1.5">B.Fiyat</th>
              <th className="border-r border-black p-1.5 bg-yellow-50">Önceki</th>
              <th className="border-r border-black p-1.5 bg-blue-50">Bu Dönem</th>
              <th className="border-r border-black p-1.5">Toplam</th>
              <th className="p-1.5">Tutar (TL)</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((item) => {
              const prevQty = previousQuantities[item.code] || 0;
              const currentQty = item.totalQty - prevQty;
              const currentAmount = currentQty * item.unitPrice;

              return (
                <tr key={item.code} className="border-b border-gray-400 hover:bg-gray-50">
                  <td className="border-r border-black p-1 text-center font-bold">{item.code}</td>
                  <td className="border-r border-black p-1">{item.description}</td>
                  <td className="border-r border-black p-1 text-center">{item.unit}</td>
                  <td className="border-r border-black p-1 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="border-r border-black p-1 text-right text-gray-500">{formatNumber(prevQty)}</td>
                  <td className="border-r border-black p-1 text-right font-bold">{formatNumber(currentQty)}</td>
                  <td className="border-r border-black p-1 text-right bg-gray-50">{formatNumber(item.totalQty)}</td>
                  <td className="p-1 text-right font-bold">{formatCurrency(currentAmount)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-800 text-white font-bold">
              <td colSpan={7} className="p-2 text-right">TOPLAM BU DÖNEM İMALATI:</td>
              <td className="p-2 text-right">{formatCurrency(grandTotalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* DİNAMİK İMZA BLOĞU - Max 4 Sütun Ayarı */}
        {/* grid-cols-2 (mobil) -> md:grid-cols-4 (masaüstü/print) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-12 px-2 text-center break-inside-avoid print:grid-cols-4">
          {(projectInfo?.signatories || []).map((sig, index) => (
            <div key={index} className="flex flex-col items-center min-w-0">
                {/* Unvan Alanı */}
                <div className="w-full border-b border-black pb-1 mb-2 min-h-[30px] flex items-end justify-center">
                   <p className="font-bold uppercase text-[10px] md:text-xs break-words w-full px-1">
                     {sig.title}
                   </p>
                </div>
                {/* İsim Alanı */}
                <p className="text-[10px] md:text-xs break-words w-full px-1">
                  {sig.name ? sig.name : '...................................'}
                </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};