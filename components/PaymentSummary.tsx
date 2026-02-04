import React, { useMemo } from 'react';
import { MeasurementSheet, ProjectInfo } from '../types';
import { formatNumber } from '../utils';
import { FileText, Printer } from 'lucide-react';

interface Props {
  sheets: MeasurementSheet[];
  previousQuantities: Record<string, number>; // Poz No -> Önceki Miktar eşleşmesi
  setPreviousQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  projectInfo: ProjectInfo;
}

export const PaymentSummary: React.FC<Props> = ({ sheets, previousQuantities, setPreviousQuantities, projectInfo }) => {
  
  // --- VERİ HESAPLAMA VE GRUPLAMA ---
  const summaryData = useMemo(() => {
    // 1. Adım: Tüm cetvelleri Poz No'ya göre grupla ve toplam metrajı bul
    const grouped: Record<string, {
      code: string;
      description: string;
      unit: string;
      unitPrice: number;
      totalQuantity: number; // Kümülatif Toplam (Metraj sayfalarından gelen)
    }> = {};

    sheets.forEach(sheet => {
      if (!grouped[sheet.code]) {
        grouped[sheet.code] = {
          code: sheet.code,
          description: sheet.description || sheet.groupName,
          unit: sheet.unit,
          unitPrice: sheet.unitPrice,
          totalQuantity: 0
        };
      }
      grouped[sheet.code].totalQuantity += sheet.totalAmount;
    });

    // 2. Adım: Hesaplamaları yap (Toplam - Önceki = Bu Dönem)
    return Object.values(grouped).map(item => {
      const prevQty = previousQuantities[item.code] || 0; // Kullanıcının girdiği değer
      const currentQty = item.totalQuantity - prevQty;    // Bu Dönem Metrajı
      
      return {
        ...item,
        prevQuantity: prevQty,
        currentQuantity: currentQty,
        
        // Parasal Hesaplamalar
        prevAmount: prevQty * item.unitPrice,
        currentAmount: currentQty * item.unitPrice,
        totalAmount: item.totalQuantity * item.unitPrice
      };
    });
  }, [sheets, previousQuantities]);

  // Dip Toplamlar
  const totalPrevAmount = summaryData.reduce((acc, row) => acc + row.prevAmount, 0);
  const totalCurrentAmount = summaryData.reduce((acc, row) => acc + row.currentAmount, 0);
  const totalGrandAmount = summaryData.reduce((acc, row) => acc + row.totalAmount, 0);

  // Input Değişikliği
  const handlePrevChange = (code: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPreviousQuantities(prev => ({
      ...prev,
      [code]: numValue
    }));
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm min-h-screen font-sans">
      
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 no-print gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-emerald-600" />
            Hakediş İcmal Özeti
          </h2>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            Aşağıdaki tabloda "Önceki Dönem" sütununa manuel giriş yapabilirsiniz. 
            Sistem, metraj sayfalarındaki toplamı "Kümülatif Toplam" kabul edip bu dönemki hakedişi otomatik hesaplar.
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition shadow-lg"
        >
          <Printer size={18} /> Tabloyu Yazdır
        </button>
      </div>

      {/* --- TABLO --- */}
      <div className="overflow-x-auto border border-black shadow-2xl">
        <table className="w-full text-xs md:text-sm border-collapse bg-white">
          <thead>
            {/* 1. Satır: Ana Başlıklar */}
            <tr className="bg-gray-100 text-center font-bold border-b border-black text-gray-800">
              <th rowSpan={2} className="border-r border-black p-2 w-24 bg-gray-200">POZ NO</th>
              <th rowSpan={2} className="border-r border-black p-2 bg-gray-200">İŞİN CİNSİ</th>
              <th rowSpan={2} className="border-r border-black p-2 w-16 bg-gray-200">BİRİM</th>
              <th rowSpan={2} className="border-r border-black p-2 w-24 bg-gray-200">BİRİM FİYAT</th>
              <th colSpan={3} className="border-r border-black p-2 border-b border-gray-400 bg-blue-50 text-blue-900">YAPILAN İŞ MİKTARI</th>
              <th colSpan={3} className="p-2 border-b border-gray-400 bg-emerald-50 text-emerald-900">YAPILAN İŞ TUTARI (TL)</th>
            </tr>
            
            {/* 2. Satır: Alt Başlıklar */}
            <tr className="bg-gray-50 text-center font-bold border-b border-black text-[10px] md:text-xs text-gray-700">
              {/* Miktar */}
              <th className="border-r border-black p-2 w-24 bg-yellow-50 text-yellow-800">ÖNCEKİ DÖNEM</th>
              <th className="border-r border-black p-2 w-24 bg-blue-100 text-blue-900">BU DÖNEM</th>
              <th className="border-r border-black p-2 w-24 bg-gray-200">TOPLAM</th>
              
              {/* Tutar */}
              <th className="border-r border-black p-2 w-28 text-gray-500">ÖNCEKİ DÖNEM</th>
              <th className="border-r border-black p-2 w-28 bg-emerald-100 text-emerald-900">BU DÖNEM</th>
              <th className="p-2 w-28 bg-gray-200">TOPLAM</th>
            </tr>
          </thead>

          <tbody className="text-gray-900 divide-y divide-gray-300">
            {summaryData.length > 0 ? (
              summaryData.map((row, index) => (
                <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                  <td className="border-r border-gray-400 p-2 font-mono font-semibold text-center">{row.code}</td>
                  <td className="border-r border-gray-400 p-2">{row.description}</td>
                  <td className="border-r border-gray-400 p-2 text-center">{row.unit}</td>
                  <td className="border-r border-gray-400 p-2 text-right font-mono">
                    {formatNumber(row.unitPrice, 2)}
                  </td>

                  {/* --- MİKTAR GİRİŞ VE HESAP ALANI --- */}
                  
                  {/* 1. ÖNCEKİ (Manuel Giriş) */}
                  <td className="border-r border-gray-400 p-1 bg-yellow-50">
                    <input 
                      type="number" 
                      value={row.prevQuantity === 0 ? '' : row.prevQuantity}
                      onChange={(e) => handlePrevChange(row.code, e.target.value)}
                      className="w-full h-full bg-transparent text-right font-mono outline-none focus:bg-yellow-100 px-1 font-bold text-gray-700"
                      placeholder="0"
                    />
                  </td>

                  {/* 2. BU DÖNEM (Otomatik: Toplam - Önceki) */}
                  <td className="border-r border-gray-400 p-2 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                    {formatNumber(row.currentQuantity, 3)}
                  </td>

                  {/* 3. TOPLAM (Sabit: Metraj Sayfasından) */}
                  <td className="border-r border-black p-2 text-right font-mono font-semibold bg-gray-50 text-gray-600">
                    {formatNumber(row.totalQuantity, 3)}
                  </td>

                  {/* --- TUTAR ALANI (Otomatik) --- */}
                  <td className="border-r border-gray-400 p-2 text-right font-mono text-gray-500">
                    {formatNumber(row.prevAmount, 2)}
                  </td>
                  <td className="border-r border-gray-400 p-2 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                    {formatNumber(row.currentAmount, 2)}
                  </td>
                  <td className="p-2 text-right font-mono font-semibold text-gray-800 bg-gray-50">
                    {formatNumber(row.totalAmount, 2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-10 text-center text-gray-400 italic">
                  Hesaplama yapılacak veri bulunamadı. Lütfen "Metraj Girişi" ekranından veri ekleyin.
                </td>
              </tr>
            )}
          </tbody>

          {/* DİP TOPLAM */}
          <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
            <tr className="text-xs md:text-sm">
              <td colSpan={4} className="border-r border-black p-3 text-right text-gray-800 uppercase tracking-wide">
                GENEL TOPLAM
              </td>
              <td className="border-r border-black bg-white"></td>
              <td className="border-r border-black bg-white"></td>
              <td className="border-r border-black bg-white"></td>
              
              <td className="border-r border-gray-400 p-2 text-right text-gray-600">
                {formatNumber(totalPrevAmount, 2)} TL
              </td>
              <td className="border-r border-gray-400 p-2 text-right text-emerald-700 text-base">
                {formatNumber(totalCurrentAmount, 2)} TL
              </td>
              <td className="p-2 text-right text-black text-base">
                {formatNumber(totalGrandAmount, 2)} TL
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* DİNAMİK İMZA BLOĞU (Sadece Çıktıda Görünür) - Max 4 Sütun */}
      <div className="mt-16 hidden print:grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 px-8 text-sm print:gap-x-4 w-full">
         {projectInfo.signatories.map((sig, index) => (
           <div key={index} className="text-center flex flex-col items-center min-w-0">
              {/* Unvan */}
              <div className="w-full border-b border-black pb-1 mb-4 flex items-end justify-center min-h-[2em]">
                  <p className="font-bold uppercase break-words w-full text-xs">
                    {sig.title}
                  </p>
              </div>
              {/* İsim */}
              <p className="break-words w-full text-xs">
                 {sig.name ? sig.name : '...................................'}
              </p>
           </div>
         ))}
      </div>

    </div>
  );
};