import React, { useState, useMemo } from 'react';
import { MeasurementSheet, ProjectInfo } from '../types';
import { formatNumber } from '../utils';
import { Printer, Settings, FileText } from 'lucide-react';

interface Props {
  sheets: MeasurementSheet[];
  previousQuantities: Record<string, number>;
  projectInfo: ProjectInfo;
}

export const PaymentCover: React.FC<Props> = ({ sheets, previousQuantities, projectInfo }) => {
  
  // --- AYARLAR STATE ---
  const [settings, setSettings] = useState({
    kdvRate: 20,         // %20 KDV
    tevkifatPay: 4,      // 4/10 Tevkifat Payı
    tevkifatPayda: 10,   // 4/10 Tevkifat Paydası
    teminatRate: 0,      // %0 Teminat Kesintisi
    stopajRate: 0,       // %0 Stopaj
    damgaVergisiRate: 0, // %0 (İsteğe bağlı)
    showSettings: true   // Ayar panelini göster/gizle
  });

  // --- ANA HESAPLAMALAR ---
  const totals = useMemo(() => {
    let totalGeneral = 0; // Kümülatif (Genel)
    let totalPrev = 0;    // Önceki
    
    // Tüm metrajları tara ve hesapla
    sheets.forEach(sheet => {
      // Genel Toplam (Kümülatif)
      const itemTotal = sheet.totalAmount * sheet.unitPrice;
      totalGeneral += itemTotal;

      // Önceki Toplam (Kullanıcının girdiği miktar * fiyat)
      const prevQty = previousQuantities[sheet.code] || 0;
      const itemPrevTotal = prevQty * sheet.unitPrice;
      totalPrev += itemPrevTotal;
    });

    // Bu Hakediş = Genel - Önceki
    const totalCurrent = totalGeneral - totalPrev;

    return { general: totalGeneral, prev: totalPrev, current: totalCurrent };
  }, [sheets, previousQuantities]);

  // --- YARDIMCI HESAPLAMA FONKSİYONU ---
  // Her sütun (Genel, Önceki, Bu Hakediş) için vergi ve kesintileri hesaplar
  const calculateColumn = (baseAmount: number) => {
    const kdvAmount = baseAmount * (settings.kdvRate / 100);
    const faturaTutari = baseAmount + kdvAmount;
    
    // Kesintiler
    const tevkifatAmount = kdvAmount * (settings.tevkifatPay / settings.tevkifatPayda);
    const teminatAmount = baseAmount * (settings.teminatRate / 100);
    const stopajAmount = baseAmount * (settings.stopajRate / 100);
    
    const totalDeductions = tevkifatAmount + teminatAmount + stopajAmount;
    const netPayable = faturaTutari - totalDeductions;

    return {
      base: baseAmount,
      kdv: kdvAmount,
      totalWithKdv: faturaTutari,
      tevkifat: tevkifatAmount,
      teminat: teminatAmount,
      stopaj: stopajAmount,
      totalDeductions,
      netPayable
    };
  };

  const colGeneral = calculateColumn(totals.general);
  const colPrev = calculateColumn(totals.prev);
  const colCurrent = calculateColumn(totals.current);

  return (
    <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm min-h-screen font-sans">
      
      {/* Üst Bar (Yazdırma ve Ayarlar) */}
      <div className="flex justify-between items-start mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-800" />
            Hakediş Arka Kapak
          </h2>
          <p className="text-sm text-gray-500">Resmi hakediş ödeme ve kesinti icmal sayfasıdır.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSettings(s => ({...s, showSettings: !s.showSettings}))}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            <Settings size={18} /> Ayarlar
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            <Printer size={18} /> Yazdır
          </button>
        </div>
      </div>

      {/* --- AYAR PANELİ (Sadece Ekranda Görünür) --- */}
      {settings.showSettings && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-8 no-print grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">KDV Oranı (%)</label>
            <input 
              type="number" value={settings.kdvRate}
              onChange={e => setSettings({...settings, kdvRate: parseFloat(e.target.value)})}
              className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Tevkifat (Pay/Payda)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" value={settings.tevkifatPay}
                onChange={e => setSettings({...settings, tevkifatPay: parseFloat(e.target.value)})}
                className="w-full border rounded p-2 text-sm text-center"
              />
              <span className="text-gray-400">/</span>
              <input 
                type="number" value={settings.tevkifatPayda}
                onChange={e => setSettings({...settings, tevkifatPayda: parseFloat(e.target.value)})}
                className="w-full border rounded p-2 text-sm text-center"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Teminat Kesintisi (%)</label>
            <input 
              type="number" value={settings.teminatRate}
              onChange={e => setSettings({...settings, teminatRate: parseFloat(e.target.value)})}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Stopaj (%)</label>
            <input 
              type="number" value={settings.stopajRate}
              onChange={e => setSettings({...settings, stopajRate: parseFloat(e.target.value)})}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* --- ANA TABLO (ARKA KAPAK) --- */}
      <div className="border-2 border-black max-w-4xl mx-auto text-sm">
        
        {/* BAŞLIKLAR */}
        <div className="grid grid-cols-4 bg-gray-300 font-bold border-b-2 border-black text-center">
          <div className="p-3 border-r border-black flex items-center justify-center">Açıklama</div>
          <div className="p-3 border-r border-black">Genel (Kümülatif)</div>
          <div className="p-3 border-r border-black">Önceki Hakediş</div>
          <div className="p-3 bg-gray-400">Bu Hakediş</div>
        </div>

        {/* A) ÖDEMELER BÖLÜMÜ */}
        <div className="p-2 font-bold bg-gray-100 border-b border-black">A) ÖDEMELER</div>
        
        {/* 1. İmalatlar */}
        <div className="grid grid-cols-4 border-b border-gray-400 hover:bg-blue-50">
          <div className="p-2 border-r border-black pl-4">1. Yapılan İşler Tutarı</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colGeneral.base, 2)}</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colPrev.base, 2)}</div>
          <div className="p-2 text-right font-mono font-bold">{formatNumber(colCurrent.base, 2)}</div>
        </div>

        {/* 2. Fiyat Farkı (Placeholder) */}
        <div className="grid grid-cols-4 border-b border-black hover:bg-blue-50">
          <div className="p-2 border-r border-black pl-4">2. Fiyat Farkı Tutarı</div>
          <div className="p-2 border-r border-black text-right font-mono">0,00</div>
          <div className="p-2 border-r border-black text-right font-mono">0,00</div>
          <div className="p-2 text-right font-mono">0,00</div>
        </div>

        {/* TOPLAM (Matrah) */}
        <div className="grid grid-cols-4 border-b border-gray-400 font-bold bg-gray-50">
          <div className="p-2 border-r border-black text-right pr-4">TOPLAM :</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colGeneral.base, 2)}</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colPrev.base, 2)}</div>
          <div className="p-2 text-right font-mono">{formatNumber(colCurrent.base, 2)}</div>
        </div>

        {/* KDV */}
        <div className="grid grid-cols-4 border-b border-black hover:bg-blue-50">
          <div className="p-2 border-r border-black text-right pr-4">KDV (%{settings.kdvRate}) :</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colGeneral.kdv, 2)}</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colPrev.kdv, 2)}</div>
          <div className="p-2 text-right font-mono">{formatNumber(colCurrent.kdv, 2)}</div>
        </div>

        {/* FATURA TUTARI */}
        <div className="grid grid-cols-4 border-b-2 border-black font-bold text-base bg-blue-100">
          <div className="p-3 border-r border-black text-right pr-4">HAKEDİŞ FATURA TUTARI :</div>
          <div className="p-3 border-r border-black text-right font-mono">{formatNumber(colGeneral.totalWithKdv, 2)}</div>
          <div className="p-3 border-r border-black text-right font-mono">{formatNumber(colPrev.totalWithKdv, 2)}</div>
          <div className="p-3 text-right font-mono text-blue-900">{formatNumber(colCurrent.totalWithKdv, 2)} TL</div>
        </div>

        {/* B) KESİNTİLER BÖLÜMÜ */}
        <div className="p-2 font-bold bg-gray-100 border-b border-black">B) KESİNTİLER</div>

        {/* Tevkifat */}
        <div className="grid grid-cols-4 border-b border-gray-400 hover:bg-red-50">
          <div className="p-2 border-r border-black pl-4">1. KDV Tevkifatı ({settings.tevkifatPay}/{settings.tevkifatPayda})</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colGeneral.tevkifat, 2)}</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colPrev.tevkifat, 2)}</div>
          <div className="p-2 text-right font-mono">{formatNumber(colCurrent.tevkifat, 2)}</div>
        </div>

        {/* Teminat */}
        <div className="grid grid-cols-4 border-b border-gray-400 hover:bg-red-50">
          <div className="p-2 border-r border-black pl-4">2. Teminat Kesintisi (%{settings.teminatRate})</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colGeneral.teminat, 2)}</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colPrev.teminat, 2)}</div>
          <div className="p-2 text-right font-mono">{formatNumber(colCurrent.teminat, 2)}</div>
        </div>

        {/* Stopaj */}
        <div className="grid grid-cols-4 border-b border-black hover:bg-red-50">
          <div className="p-2 border-r border-black pl-4">3. Stopaj Kesintisi (%{settings.stopajRate})</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colGeneral.stopaj, 2)}</div>
          <div className="p-2 border-r border-black text-right font-mono">{formatNumber(colPrev.stopaj, 2)}</div>
          <div className="p-2 text-right font-mono">{formatNumber(colCurrent.stopaj, 2)}</div>
        </div>

        {/* KESİNTİLER TOPLAMI */}
        <div className="grid grid-cols-4 border-b-2 border-black font-bold bg-blue-100 text-base">
          <div className="p-3 border-r border-black text-right pr-4">HAKEDİŞ KESİNTİ TOPLAMI :</div>
          <div className="p-3 border-r border-black text-right font-mono">{formatNumber(colGeneral.totalDeductions, 2)}</div>
          <div className="p-3 border-r border-black text-right font-mono">{formatNumber(colPrev.totalDeductions, 2)}</div>
          <div className="p-3 text-right font-mono text-red-700">{formatNumber(colCurrent.totalDeductions, 2)} TL</div>
        </div>

        {/* NET ÖDENECEK */}
        <div className="grid grid-cols-4 font-bold text-lg bg-emerald-200 text-emerald-900">
          <div className="p-4 border-r border-black text-right pr-4">NET ÖDENECEK TUTAR :</div>
          <div className="p-4 col-span-3 text-right font-mono pr-4">
            {formatNumber(colCurrent.netPayable, 2)} TL
          </div>
        </div>
      </div>

      {/* ALT BİLGİ */}
      <div className="max-w-4xl mx-auto mt-4 text-sm text-gray-600 no-print">
         * Bu dönem hakedişi ile Yüklenici'ye ödenecek net tutardır. (Fatura Tutarı - Kesintiler)
      </div>
      
      // components/PaymentCover.tsx dosyasının en altındaki İmza Bloğu kısmını bununla değiştirin:

      {/* DİNAMİK İMZA BLOĞU (Sadece Baskıda) - DÜZELTİLMİŞ VERSİYON */}
      <div className="hidden print:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 mt-20 px-4 mx-auto text-sm print:gap-x-2 w-full">
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