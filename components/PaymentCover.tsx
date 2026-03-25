import React, { useState, useMemo } from 'react';
import { MeasurementSheet, ProjectInfo, CoverData, CoverRow } from '../types';
import { formatNumber, generateId } from '../utils';
import { Printer, Settings, FileText, Plus, Trash2, ArrowRightLeft, Info, HelpCircle } from 'lucide-react'; // İkonlar eklendi

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
  const workDone = useMemo(() => {
    let totalGeneral = 0;
    let totalPrev = 0;
    
    sheets.forEach(sheet => {
      const itemTotal = sheet.totalAmount * sheet.unitPrice;
      totalGeneral += itemTotal;
      const prevQty = previousQuantities[sheet.id] || 0;
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

  // --- ROW YÖNETİM FONKSİYONLARI ---
  const addRow = (type: 'extra' | 'deduction') => {
    const newRow: CoverRow = { id: generateId(), description: '', prevAmount: 0, currentAmount: 0 };
    if (type === 'extra') {
      setCoverData(prev => ({ ...prev, extraPayments: [...prev.extraPayments, newRow] }));
    } else {
      setCoverData(prev => ({ ...prev, deductions: [...prev.deductions, newRow] }));
    }
  };

  const removeRow = (type: 'extra' | 'deduction', id: string) => {
    if (confirm("Bu satırı silmek istediğinize emin misiniz?")) {
      if (type === 'extra') {
        setCoverData(prev => ({ ...prev, extraPayments: prev.extraPayments.filter(r => r.id !== id) }));
      } else {
        setCoverData(prev => ({ ...prev, deductions: prev.deductions.filter(r => r.id !== id) }));
      }
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
    <div className="bg-white p-4 md:p-8 rounded-xl border border-slate-200 shadow-sm min-h-full font-sans selection:bg-blue-100 selection:text-blue-950">
      
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 no-print gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <FileText size={20} />
            </div>
            Hakediş Arka Kapak Tasarımı
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-2xl flex items-center gap-1.5">
            <Info size={14} className="text-blue-500" />
            Resmi hakediş ödeme ve kesinti icmal sayfasıdır. İcap eden diğer tüm kalemleri manuel ekleyebilirsiniz.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium shadow-sm ${showSettings ? 'bg-amber-100 border border-amber-300 text-amber-900' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
            <Settings size={16} /> Ayarlar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition text-sm font-medium shadow-sm">
            <Printer size={16} /> Yazdır
          </button>
        </div>
      </div>

      {/* Ayar Paneli */}
      {showSettings && (
        <div className="bg-white border border-amber-200 p-5 rounded-xl mb-10 no-print shadow-sm animate-in slide-in-from-top-2">
           <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-amber-900">KDV Oranı:</label>
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-400 bg-white">
                <span className="text-sm text-slate-400 font-mono">%</span>
                <input 
                    type="number" 
                    value={coverData.kdvRate}
                    onChange={(e) => setCoverData({...coverData, kdvRate: parseFloat(e.target.value) || 0})}
                    className="w-16 text-center font-bold text-slate-900 outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 max-w-sm flex items-center gap-1.5"><HelpCircle size={14} className="text-slate-400" /> Yapılan işler hakedişe giren cetvellerden gelir. Diğer tüm kalemleri manuel ekleyebilirsiniz.</p>
           </div>
        </div>
      )}

      {/* --- ANA TABLO (SCROLL WRAPPER) --- */}
      <div className="md:hidden flex items-center gap-2 text-xs text-gray-400 mb-2 justify-center no-print">
         <ArrowRightLeft size={14} /> Tabloyu yatay kaydırabilirsiniz
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0 pb-6 md:pb-0 px-4 md:px-0">
        <div className="min-w-[700px] border border-slate-200 rounded-lg max-w-6xl mx-auto text-sm shadow-sm print:border-none print:shadow-none break-inside-avoid">
          
          {/* Başlıklar */}
          <div className="grid grid-cols-12 bg-slate-50 font-bold border-b border-slate-200 text-center text-slate-700 text-[10px] uppercase tracking-wider rounded-t-lg print:border-b-black">
            <div className="col-span-4 p-3 border-r border-slate-100 text-left pl-5">Açıklama</div>
            <div className="col-span-2 p-3 border-r border-slate-100">Kümülatif</div>
            <div className="col-span-3 p-3 border-r border-slate-100 bg-amber-50/50 text-amber-900">Önceki Hakediş</div>
            <div className="col-span-3 p-3 bg-blue-50/50 text-blue-900">Bu Hakediş</div>
          </div>

          {/* A) ÖDEMELER */}
          <div className="p-3 font-bold bg-white/50 border-b border-slate-100 flex justify-between items-center group text-xs text-slate-600 tracking-wider">
            <span>A) ÖDEMELER</span>
            <button onClick={() => addRow('extra')} className="text-xs border border-green-200 bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 flex items-center gap-1.5 no-print transition">
              <Plus size={14} /> Satır Ekle
            </button>
          </div>

          {/* 1. Yapılan İşler (Otomatik) */}
          <div className="grid grid-cols-12 border-b border-slate-100 bg-white">
            <div className="col-span-4 p-3 border-r border-slate-100 pl-5 font-semibold text-slate-800">1. Yapılan İşler Tutarı</div>
            <div className="col-span-2 p-3 border-r border-slate-100 text-right font-mono text-slate-500">{formatNumber(workDone.general)}</div>
            <div className="col-span-3 p-3 border-r border-slate-100 text-right font-mono bg-amber-50/20 text-amber-700">{formatNumber(workDone.prev)}</div>
            <div className="col-span-3 p-3 text-right font-mono bg-blue-50/10 font-bold text-blue-800">{formatNumber(workDone.current)}</div>
          </div>

          {/* Manuel Ek Ödemeler */}
          {coverData.extraPayments.map((row, idx) => {
            const rowTotal = (row.prevAmount || 0) + (row.currentAmount || 0);
            return (
              <div key={row.id} className="grid grid-cols-12 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                <div className="col-span-4 p-0 border-r border-slate-100 pl-3 flex items-center focus-within:ring-2 focus-within:ring-green-300">
                  <span className="mr-3 text-slate-300 text-xs font-mono w-4 text-center">{idx + 2}.</span>
                  <input 
                    type="text" 
                    value={row.description}
                    onChange={(e) => updateRow('extra', row.id, 'description', e.target.value)}
                    placeholder="Ek ödeme kalemi..."
                    className="flex-1 bg-transparent p-3 outline-none text-sm placeholder:text-slate-300"
                  />
                  <button onClick={() => removeRow('extra', row.id)} className="ml-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 no-print transition mr-3"><Trash2 size={14}/></button>
                </div>
                <div className="col-span-2 p-3 border-r border-slate-100 text-right font-mono text-slate-500">{formatNumber(rowTotal)}</div>
                <div className="col-span-3 p-0 border-r border-slate-100 focus-within:ring-2 focus-within:ring-green-300">
                  <input 
                    type="number" value={row.prevAmount || ''} 
                    onChange={(e) => updateRow('extra', row.id, 'prevAmount', parseFloat(e.target.value) || 0)}
                    className="w-full text-right p-3 bg-transparent outline-none font-mono text-amber-700" placeholder="0"
                  />
                </div>
                <div className="col-span-3 p-0 focus-within:ring-2 focus-within:ring-green-300 bg-blue-50/10">
                  <input 
                    type="number" value={row.currentAmount || ''} 
                    onChange={(e) => updateRow('extra', row.id, 'currentAmount', parseFloat(e.target.value) || 0)}
                    className="w-full text-right p-3 bg-transparent outline-none font-mono font-bold text-blue-800" placeholder="0"
                  />
                </div>
              </div>
            );
          })}

          {/* TOPLAM A */}
          <div className="grid grid-cols-12 border-b-2 border-slate-200 font-bold bg-slate-100 print:border-b-black print:border-b">
            <div className="col-span-4 p-3 border-r border-slate-200 text-right pr-5 text-slate-700 uppercase tracking-wide text-[11px]">TOPLAM (Matrah):</div>
            <div className="col-span-2 p-3 border-r border-slate-200 text-right font-mono text-slate-600">{formatNumber(totalAmountA.general)}</div>
            <div className="col-span-3 p-3 border-r border-slate-200 text-right font-mono bg-amber-50/50 text-amber-950">{formatNumber(totalAmountA.prev)}</div>
            <div className="col-span-3 p-3 text-right font-mono bg-blue-50/30 text-blue-950">{formatNumber(totalAmountA.current)}</div>
          </div>

          {/* KDV */}
          <div className="grid grid-cols-12 border-b border-slate-100">
            <div className="col-span-4 p-3 border-r border-slate-100 text-right pr-5 text-slate-500 text-[11px] uppercase">KDV (%{coverData.kdvRate}):</div>
            <div className="col-span-2 p-3 border-r border-slate-100 text-right font-mono text-slate-400">{formatNumber(kdvAmount.general)}</div>
            <div className="col-span-3 p-3 border-r border-slate-100 text-right font-mono text-slate-400">{formatNumber(kdvAmount.prev)}</div>
            <div className="col-span-3 p-3 text-right font-mono text-slate-400">{formatNumber(kdvAmount.current)}</div>
          </div>

          {/* FATURA TUTARI */}
          <div className="grid grid-cols-12 border-b-2 border-slate-300 font-bold text-base bg-blue-100 print:border-b-black print:border-b-2">
            <div className="col-span-4 p-4 border-r border-blue-200 text-right pr-5 text-blue-900 uppercase tracking-wide text-[11px]">HAKEDİŞ FATURA TUTARI:</div>
            <div className="col-span-2 p-4 border-r border-blue-200 text-right font-mono text-blue-950">{formatNumber(invoiceAmount.general)}</div>
            <div className="col-span-3 p-4 border-r border-blue-200 text-right font-mono text-blue-950">{formatNumber(invoiceAmount.prev)}</div>
            <div className="col-span-3 p-4 text-right font-mono text-blue-950 text-base">{formatNumber(invoiceAmount.current)} <span className="text-xs font-sans text-blue-500 ml-1">TL</span></div>
          </div>

          {/* B) KESİNTİLER */}
          <div className="p-3 font-bold bg-white/50 border-b border-slate-100 flex justify-between items-center group text-xs text-slate-600 tracking-wider">
            <span>B) KESİNTİLER</span>
            <button onClick={() => addRow('deduction')} className="text-xs border border-red-200 bg-red-50 text-red-700 px-3 py-1 rounded-lg hover:bg-red-100 flex items-center gap-1.5 no-print transition">
              <Plus size={14} /> Satır Ekle
            </button>
          </div>

          {/* Manuel Kesinti Satırları */}
          {coverData.deductions.length === 0 && (
             <div className="p-8 text-center text-slate-400 italic text-sm border-b border-slate-100 flex flex-col items-center gap-2 no-print">
               <HelpCircle size={28} className="text-slate-200" />
               <span className="text-xs">Kesinti eklemek için "Satır Ekle" butonunu kullanın.</span>
               <span className="text-[10px]">Stopaj, Teminat, Avans Mahsubu vb. kalemler bu bölüme eklenebilir.</span>
             </div>
          )}

          {coverData.deductions.map((row, idx) => {
            const rowTotal = (row.prevAmount || 0) + (row.currentAmount || 0);
            return (
              <div key={row.id} className="grid grid-cols-12 border-b border-slate-100 hover:bg-red-50 transition-colors group">
                <div className="col-span-4 p-0 border-r border-slate-100 pl-3 flex items-center focus-within:ring-2 focus-within:ring-red-300">
                  <span className="mr-3 text-slate-300 text-xs font-mono w-4 text-center">{idx + 1}.</span>
                  <input 
                    type="text" 
                    value={row.description}
                    onChange={(e) => updateRow('deduction', row.id, 'description', e.target.value)}
                    placeholder="Kesinti kalemi..."
                    className="flex-1 bg-transparent p-3 outline-none text-sm placeholder:text-slate-300"
                  />
                  <button onClick={() => removeRow('deduction', row.id)} className="ml-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 no-print transition mr-3"><Trash2 size={14}/></button>
                </div>
                <div className="col-span-2 p-3 border-r border-slate-100 text-right font-mono text-slate-500">{formatNumber(rowTotal)}</div>
                <div className="col-span-3 p-0 border-r border-slate-100 focus-within:ring-2 focus-within:ring-red-300">
                  <input 
                    type="number" value={row.prevAmount || ''} 
                    onChange={(e) => updateRow('deduction', row.id, 'prevAmount', parseFloat(e.target.value) || 0)}
                    className="w-full text-right p-3 bg-transparent outline-none font-mono text-amber-700" placeholder="0"
                  />
                </div>
                <div className="col-span-3 p-0 focus-within:ring-2 focus-within:ring-red-300 bg-red-50/10">
                  <input 
                    type="number" value={row.currentAmount || ''} 
                    onChange={(e) => updateRow('deduction', row.id, 'currentAmount', parseFloat(e.target.value) || 0)}
                    className="w-full text-right p-3 bg-transparent outline-none font-mono font-bold text-red-800" placeholder="0"
                  />
                </div>
              </div>
            );
          })}

          {/* KESİNTİLER TOPLAMI */}
          <div className="grid grid-cols-12 border-b-2 border-slate-400 font-bold bg-slate-100 print:border-b-black print:border-b-2">
            <div className="col-span-4 p-3 border-r border-slate-200 text-right pr-5 text-slate-700 uppercase tracking-wide text-[11px]">KESİNTİLER TOPLAMI:</div>
            <div className="col-span-2 p-3 border-r border-slate-200 text-right font-mono text-slate-600">{formatNumber(deductionTotals.general)}</div>
            <div className="col-span-3 p-3 border-r border-slate-200 text-right font-mono bg-amber-50/50 text-amber-950">{formatNumber(deductionTotals.prev)}</div>
            <div className="col-span-3 p-3 text-right font-mono bg-red-50/30 text-red-950">{formatNumber(deductionTotals.current)}</div>
          </div>

          {/* NET ÖDENECEK */}
          <div className="grid grid-cols-12 font-bold text-lg bg-white group rounded-b-lg">
            <div className="col-span-4 p-5 border-r border-slate-200 text-right pr-5 text-slate-800 uppercase tracking-wider text-[11px] print:text-black">NET ÖDENECEK TUTAR:</div>
            {/* NET ÖDENECEK ALANI - YENİ TASARIM */}
            <div className="col-span-8 p-5 text-right font-mono text-lg bg-sky-50 transition-colors selection:bg-sky-200 group-hover:bg-sky-100 print:bg-white print:text-black">
              {formatNumber(netPayable.current, 2)} <span className="text-sm font-sans text-sky-600 ml-2 print:text-black">TL</span>
            </div>
          </div>
        </div>
      </div>

      {/* ALT BİLGİ */}
      <div className="max-w-6xl mx-auto mt-6 text-sm text-slate-600 flex items-center gap-2 no-print justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-inner">
         <HelpCircle size={16} className="text-blue-500" />
         * Hesaplamalar: (Hakediş Fatura Tutarı - Kesintiler Toplamı) formülü ile bu hakediş dönemi için yapılmıştır.
      </div>
      
      {/* İMZA BLOĞU (Sadece Çıktıda Görünür) */}
      <div className="hidden print:grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-20 px-8 mx-auto text-sm print:gap-x-4 w-full break-inside-avoid">
        {(projectInfo?.signatories || []).map((sig, index) => (
          <div key={index} className="text-center flex flex-col items-center min-w-0">
              <div className="w-full border-b border-black pb-1 mb-4 flex items-end justify-center min-h-[2em]">
                 <p className="font-bold uppercase break-words w-full text-xs text-black">{sig.title}</p>
              </div>
              <p className="break-words w-full text-xs text-black">
                 {sig.name ? sig.name : '...................................'}
              </p>
          </div>
        ))}
      </div>
    </div>
  );
};