import React, { useState, useMemo } from 'react';
import { MeasurementSheet, ProjectInfo, CoverData, CoverRow } from '../types';
import { formatNumber, generateId } from '../utils';
import { Printer, Settings, FileText, Plus, Trash2, ArrowRightLeft } from 'lucide-react'; // Icon eklendi

interface Props {
  sheets: MeasurementSheet[];
  previousQuantities: Record<string, number>;
  projectInfo: ProjectInfo;
  coverData: CoverData;
  setCoverData: React.Dispatch<React.SetStateAction<CoverData>>;
}

export const PaymentCover: React.FC<Props> = ({ sheets, previousQuantities, projectInfo, coverData, setCoverData }) => {
  
  const [showSettings, setShowSettings] = useState(true);

  // --- HESAPLAMALAR ---
  // (Hesaplama kodları aynı kalacak, sadece render kısmı değişiyor)
  const workDone = useMemo(() => {
    let totalGeneral = 0;
    let totalPrev = 0;
    
    sheets.forEach(sheet => {
      const itemTotal = sheet.totalAmount * sheet.unitPrice;
      totalGeneral += itemTotal;
      const prevQty = previousQuantities[sheet.code] || 0;
      totalPrev += prevQty * sheet.unitPrice;
    });

    return { 
      general: totalGeneral, 
      prev: totalPrev, 
      current: totalGeneral - totalPrev 
    };
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

  // A) Toplam Hakediş Tutarı (Matrah)
  const totalAmountA = {
    prev: workDone.prev + extraTotals.prev,
    current: workDone.current + extraTotals.current,
    general: workDone.general + extraTotals.general
  };

  // KDV Tutarı
  const kdvAmount = {
    prev: totalAmountA.prev * (coverData.kdvRate / 100),
    current: totalAmountA.current * (coverData.kdvRate / 100),
    general: totalAmountA.general * (coverData.kdvRate / 100)
  };

  // Fatura Tutarı (Matrah + KDV)
  const invoiceAmount = {
    prev: totalAmountA.prev + kdvAmount.prev,
    current: totalAmountA.current + kdvAmount.current,
    general: totalAmountA.general + kdvAmount.general
  };

  // Net Ödenecek
  const netPayable = {
    prev: invoiceAmount.prev - deductionTotals.prev,
    current: invoiceAmount.current - deductionTotals.current,
    general: invoiceAmount.general - deductionTotals.general
  };

  // --- ROW YÖNETİM FONKSİYONLARI (Aynı kalıyor) ---
  const addRow = (type: 'extra' | 'deduction') => {
    const newRow: CoverRow = { id: generateId(), description: '', prevAmount: 0, currentAmount: 0 };
    if (type === 'extra') {
      setCoverData(prev => ({ ...prev, extraPayments: [...prev.extraPayments, newRow] }));
    } else {
      setCoverData(prev => ({ ...prev, deductions: [...prev.deductions, newRow] }));
    }
  };

  const removeRow = (type: 'extra' | 'deduction', id: string) => {
    if (type === 'extra') {
      setCoverData(prev => ({ ...prev, extraPayments: prev.extraPayments.filter(r => r.id !== id) }));
    } else {
      setCoverData(prev => ({ ...prev, deductions: prev.deductions.filter(r => r.id !== id) }));
    }
  };

  const updateRow = (type: 'extra' | 'deduction', id: string, field: keyof CoverRow, value: any) => {
    const updater = (rows: CoverRow[]) => rows.map(r => r.id === id ? { ...r, [field]: value } : r);
    if (type === 'extra') {
      setCoverData(prev => ({ ...prev, extraPayments: updater(prev.extraPayments) }));
    } else {
      setCoverData(prev => ({ ...prev, deductions: updater(prev.deductions) }));
    }
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-xl shadow-sm min-h-screen font-sans">
      
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 no-print gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-800" /> Hakediş Arka Kapak
          </h2>
          <p className="text-sm text-gray-500">Resmi hakediş ödeme ve kesinti icmal sayfasıdır.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowSettings(!showSettings)} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
            <Settings size={18} /> <span className="md:hidden">Ayarlar</span>
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg">
            <Printer size={18} /> <span className="md:hidden">Yazdır</span>
          </button>
        </div>
      </div>

      {/* Ayar Paneli */}
      {showSettings && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-8 no-print animate-in slide-in-from-top-2">
           <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-gray-700">KDV Oranı (%):</label>
              <input 
                type="number" 
                value={coverData.kdvRate}
                onChange={(e) => setCoverData({...coverData, kdvRate: parseFloat(e.target.value)})}
                className="border border-gray-300 rounded px-2 py-1 w-24 text-center font-bold"
              />
           </div>
           <p className="text-xs text-gray-500 mt-2">* Diğer tüm kesinti ve ek ödemeleri aşağıdaki tabloya manuel olarak ekleyebilirsiniz.</p>
        </div>
      )}

      {/* --- ANA TABLO (SCROLL WRAPPER EKLENDİ) --- */}
      <div className="md:hidden flex items-center gap-2 text-xs text-gray-400 mb-2 justify-center no-print">
         <ArrowRightLeft size={14} /> Tabloyu yatay kaydırabilirsiniz
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0 pb-6 md:pb-0 px-4 md:px-0">
        <div className="min-w-[700px] border-2 border-black max-w-5xl mx-auto text-sm"> {/* min-w-[700px] eklendi */}
          
          {/* Başlıklar */}
          <div className="grid grid-cols-12 bg-gray-300 font-bold border-b-2 border-black text-center">
            <div className="col-span-4 p-3 border-r border-black">Açıklama</div>
            <div className="col-span-2 p-3 border-r border-black">Genel (Kümülatif)</div>
            <div className="col-span-3 p-3 border-r border-black bg-yellow-50">Önceki Hakediş</div>
            <div className="col-span-3 p-3 bg-blue-50">Bu Hakediş</div>
          </div>

          {/* A) ÖDEMELER */}
          <div className="p-2 font-bold bg-gray-100 border-b border-black flex justify-between items-center group">
            <span>A) ÖDEMELER</span>
            <button onClick={() => addRow('extra')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex items-center gap-1 no-print">
              <Plus size={14} /> Satır Ekle
            </button>
          </div>

          {/* 1. Yapılan İşler (Otomatik) */}
          <div className="grid grid-cols-12 border-b border-gray-300 bg-white">
            <div className="col-span-4 p-2 border-r border-black pl-4 font-semibold text-gray-700">1. Yapılan İşler Tutarı</div>
            <div className="col-span-2 p-2 border-r border-black text-right font-mono bg-gray-50">{formatNumber(workDone.general)}</div>
            <div className="col-span-3 p-2 border-r border-black text-right font-mono bg-yellow-50/30">{formatNumber(workDone.prev)}</div>
            <div className="col-span-3 p-2 text-right font-mono bg-blue-50/30 font-bold">{formatNumber(workDone.current)}</div>
          </div>

          {/* Manuel Ek Ödemeler */}
          {coverData.extraPayments.map((row, idx) => {
            const rowTotal = (row.prevAmount || 0) + (row.currentAmount || 0);
            return (
              <div key={row.id} className="grid grid-cols-12 border-b border-gray-300 hover:bg-gray-50 group">
                <div className="col-span-4 p-1 border-r border-black pl-4 flex items-center">
                  <span className="mr-2 text-gray-400 text-xs no-print">{idx + 2}.</span>
                  <input 
                    type="text" 
                    value={row.description}
                    onChange={(e) => updateRow('extra', row.id, 'description', e.target.value)}
                    placeholder="Ek Ödeme Açıklaması..."
                    className="w-full bg-transparent outline-none text-sm placeholder-gray-300"
                  />
                  <button onClick={() => removeRow('extra', row.id)} className="ml-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14}/></button>
                </div>
                <div className="col-span-2 p-2 border-r border-black text-right font-mono text-gray-500">{formatNumber(rowTotal)}</div>
                <div className="col-span-3 p-1 border-r border-black bg-yellow-50/20">
                  <input 
                    type="number" value={row.prevAmount || ''} 
                    onChange={(e) => updateRow('extra', row.id, 'prevAmount', parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent outline-none font-mono" placeholder="0"
                  />
                </div>
                <div className="col-span-3 p-1 bg-blue-50/20">
                  <input 
                    type="number" value={row.currentAmount || ''} 
                    onChange={(e) => updateRow('extra', row.id, 'currentAmount', parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent outline-none font-mono font-bold text-gray-800" placeholder="0"
                  />
                </div>
              </div>
            );
          })}

          {/* TOPLAM A */}
          <div className="grid grid-cols-12 border-b border-gray-400 font-bold bg-gray-50">
            <div className="col-span-4 p-2 border-r border-black text-right pr-4">TOPLAM (Matrah) :</div>
            <div className="col-span-2 p-2 border-r border-black text-right font-mono">{formatNumber(totalAmountA.general)}</div>
            <div className="col-span-3 p-2 border-r border-black text-right font-mono">{formatNumber(totalAmountA.prev)}</div>
            <div className="col-span-3 p-2 text-right font-mono">{formatNumber(totalAmountA.current)}</div>
          </div>

          {/* KDV */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-4 p-2 border-r border-black text-right pr-4">KDV (%{coverData.kdvRate}) :</div>
            <div className="col-span-2 p-2 border-r border-black text-right font-mono text-gray-600">{formatNumber(kdvAmount.general)}</div>
            <div className="col-span-3 p-2 border-r border-black text-right font-mono text-gray-600">{formatNumber(kdvAmount.prev)}</div>
            <div className="col-span-3 p-2 text-right font-mono text-gray-600">{formatNumber(kdvAmount.current)}</div>
          </div>

          {/* FATURA TUTARI */}
          <div className="grid grid-cols-12 border-b-2 border-black font-bold text-base bg-blue-100">
            <div className="col-span-4 p-3 border-r border-black text-right pr-4">HAKEDİŞ FATURA TUTARI :</div>
            <div className="col-span-2 p-3 border-r border-black text-right font-mono">{formatNumber(invoiceAmount.general)}</div>
            <div className="col-span-3 p-3 border-r border-black text-right font-mono">{formatNumber(invoiceAmount.prev)}</div>
            <div className="col-span-3 p-3 text-right font-mono text-blue-900">{formatNumber(invoiceAmount.current)} TL</div>
          </div>

          {/* B) KESİNTİLER */}
          <div className="p-2 font-bold bg-gray-100 border-b border-black flex justify-between items-center group">
            <span>B) KESİNTİLER</span>
            <button onClick={() => addRow('deduction')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex items-center gap-1 no-print">
              <Plus size={14} /> Satır Ekle
            </button>
          </div>

          {/* Manuel Kesinti Satırları */}
          {coverData.deductions.length === 0 && (
             <div className="p-4 text-center text-gray-400 italic text-xs border-b border-gray-300 no-print">Kesinti eklemek için "Satır Ekle" butonunu kullanın (Örn: Tevkifat, Stopaj, Teminat).</div>
          )}

          {coverData.deductions.map((row, idx) => {
            const rowTotal = (row.prevAmount || 0) + (row.currentAmount || 0);
            return (
              <div key={row.id} className="grid grid-cols-12 border-b border-gray-300 hover:bg-red-50 group">
                <div className="col-span-4 p-1 border-r border-black pl-4 flex items-center">
                  <span className="mr-2 text-gray-400 text-xs no-print">{idx + 1}.</span>
                  <input 
                    type="text" 
                    value={row.description}
                    onChange={(e) => updateRow('deduction', row.id, 'description', e.target.value)}
                    placeholder="Kesinti Açıklaması"
                    className="w-full bg-transparent outline-none text-sm placeholder-gray-300"
                  />
                  <button onClick={() => removeRow('deduction', row.id)} className="ml-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14}/></button>
                </div>
                <div className="col-span-2 p-2 border-r border-black text-right font-mono text-gray-500">{formatNumber(rowTotal)}</div>
                <div className="col-span-3 p-1 border-r border-black bg-yellow-50/20">
                  <input 
                    type="number" value={row.prevAmount || ''} 
                    onChange={(e) => updateRow('deduction', row.id, 'prevAmount', parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent outline-none font-mono" placeholder="0"
                  />
                </div>
                <div className="col-span-3 p-1 bg-red-50/20">
                  <input 
                    type="number" value={row.currentAmount || ''} 
                    onChange={(e) => updateRow('deduction', row.id, 'currentAmount', parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent outline-none font-mono font-bold text-gray-800" placeholder="0"
                  />
                </div>
              </div>
            );
          })}

          {/* KESİNTİLER TOPLAMI */}
          <div className="grid grid-cols-12 border-b-2 border-black font-bold bg-red-50 text-base">
            <div className="col-span-4 p-3 border-r border-black text-right pr-4">KESİNTİLER TOPLAMI :</div>
            <div className="col-span-2 p-3 border-r border-black text-right font-mono">{formatNumber(deductionTotals.general)}</div>
            <div className="col-span-3 p-3 border-r border-black text-right font-mono">{formatNumber(deductionTotals.prev)}</div>
            <div className="col-span-3 p-3 text-right font-mono text-red-700">{formatNumber(deductionTotals.current)} TL</div>
          </div>

          {/* NET ÖDENECEK */}
          <div className="grid grid-cols-12 font-bold text-lg bg-emerald-200 text-emerald-900">
            <div className="col-span-4 p-4 border-r border-black text-right pr-4">NET ÖDENECEK TUTAR :</div>
            <div className="col-span-8 p-4 text-right font-mono pr-4">
              {formatNumber(netPayable.current, 2)} TL
            </div>
          </div>
        </div>
      </div>

      {/* ALT BİLGİ */}
      <div className="max-w-5xl mx-auto mt-4 text-sm text-gray-600 no-print">
         * Hesaplamalar: (Fatura Tutarı - Kesintiler Toplamı) formülü ile yapılmıştır.
      </div>
      
      {/* İMZA BLOĞU */}
      <div className="hidden print:grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-20 px-8 mx-auto text-sm print:gap-x-4 w-full">
        {(projectInfo?.signatories || []).map((sig, index) => (
          <div key={index} className="text-center flex flex-col items-center min-w-0">
              <div className="w-full border-b border-black pb-1 mb-4 flex items-end justify-center min-h-[2em]">
                 <p className="font-bold uppercase break-words w-full text-xs">{sig.title}</p>
              </div>
              <p className="break-words w-full text-xs">
                 {sig.name ? sig.name : '...................................'}
              </p>
          </div>
        ))}
      </div>
    </div>
  );
};