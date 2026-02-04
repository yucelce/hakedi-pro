import React, { useState } from 'react';
import { MeasurementSheet, Measurement } from '../types';
import { generateId, formatNumber } from '../utils';
import { 
  Plus, Trash2, FolderPlus, ChevronDown, ChevronRight, 
  FileSpreadsheet, Calculator, X, Save, Edit2 
} from 'lucide-react';

interface Props {
  items: MeasurementSheet[]; // Artık WorkItem dizisi değil, Sheet dizisi alıyor
  setItems: React.Dispatch<React.SetStateAction<MeasurementSheet[]>>;
}

export const InputSection: React.FC<Props> = ({ items, setItems }) => {
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [formData, setFormData] = useState({
    groupName: '', // A Blok Temel
    code: '',      // 15.120.100
    description: '', // Beton dökülmesi...
    unit: 'm3',
    unitPrice: 0
  });

  const toggleExpand = (id: string) => {
    setExpandedSheets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- MODAL İŞLEMLERİ ---
  const openNewSheetModal = () => {
    setFormData({ groupName: '', code: '', description: '', unit: 'm3', unitPrice: 0 });
    setIsModalOpen(true);
  };

  const handleSaveSheet = () => {
    if (!formData.groupName) { alert("Lütfen cetvel adını giriniz."); return; }

    const newSheet: MeasurementSheet = {
      id: generateId(),
      groupName: formData.groupName,
      code: formData.code || 'Genel',
      description: formData.description || '',
      unit: formData.unit,
      unitPrice: Number(formData.unitPrice),
      measurements: [],
      totalAmount: 0,
      calculatedCost: 0
    };

    setItems(prev => [...prev, newSheet]);
    setExpandedSheets(prev => ({ ...prev, [newSheet.id]: true }));
    setIsModalOpen(false);
  };

  // --- HESAPLAMA YARDIMCISI ---
  const recalculateSheet = (sheet: MeasurementSheet, newMeasurements: Measurement[]): MeasurementSheet => {
    const totalAmount = newMeasurements.reduce((acc, curr) => acc + curr.subtotal, 0);
    return { 
      ...sheet, 
      measurements: newMeasurements, 
      totalAmount,
      calculatedCost: totalAmount * sheet.unitPrice 
    };
  };

  // --- SATIR İŞLEMLERİ ---
  const handleAddRow = (sheetId: string) => {
    setItems(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      const newRow: Measurement = {
        id: generateId(), description: '', width: undefined, length: undefined, height: undefined, count: 1, subtotal: 0
      };
      return recalculateSheet(sheet, [...sheet.measurements, newRow]);
    }));
  };

  const handleDeleteRow = (sheetId: string, rowId: string) => {
    if(!confirm("Satırı silmek istediğinize emin misiniz?")) return;
    setItems(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      return recalculateSheet(sheet, sheet.measurements.filter(m => m.id !== rowId));
    }));
  };

  const handleUpdateRow = (sheetId: string, rowId: string, field: keyof Measurement, value: any) => {
    setItems(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      const newMeasurements = sheet.measurements.map(row => {
        if (row.id !== rowId) return row;
        const updatedRow = { ...row, [field]: value };
        const w = updatedRow.width ?? 1;
        const l = updatedRow.length ?? 1;
        const h = updatedRow.height ?? 1;
        const c = updatedRow.count ?? 0;
        const hasDimensions = updatedRow.width !== undefined || updatedRow.length !== undefined || updatedRow.height !== undefined;
        updatedRow.subtotal = hasDimensions ? (w * l * h * c) : 0;
        return updatedRow;
      });
      return recalculateSheet(sheet, newMeasurements);
    }));
  };

  const handleDeleteSheet = (id: string) => {
    if(confirm("Bu metraj cetvelini tamamen silmek istediğinize emin misiniz?")) {
      setItems(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      
      {/* ÜST BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center sticky top-20 z-40">
        <div>
           <h2 className="text-lg font-bold text-gray-800">Metraj Cetvelleri</h2>
           <p className="text-xs text-gray-500">Toplam {items.length} adet cetvel bulundu.</p>
        </div>
        <button 
          onClick={openNewSheetModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition flex items-center gap-2"
        >
          <Plus size={20} /> Yeni Cetvel Oluştur
        </button>
      </div>

      {/* LİSTE */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
           <div className="bg-slate-50 p-4 rounded-full inline-block mb-4"><FileSpreadsheet size={40} className="text-slate-400"/></div>
           <h3 className="text-lg font-medium text-gray-700">Henüz hiç metraj cetveli yok</h3>
           <p className="text-gray-500 mb-6">Başlamak için "Yeni Cetvel Oluştur" butonuna tıklayın.</p>
        </div>
      ) : (
        items.map((sheet) => {
          const isExpanded = expandedSheets[sheet.id];
          return (
            <div key={sheet.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
              
              {/* HEADER (Kart Başlığı) */}
              <div 
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer select-none ${isExpanded ? 'bg-slate-50 border-b' : 'bg-white'}`}
                onClick={() => toggleExpand(sheet.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-slate-400">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div>
                    {/* Üst Bilgi (Poz No) - Küçük */}
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">
                         {sheet.code}
                       </span>
                       <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                         {sheet.description}
                       </span>
                    </div>
                    {/* Ana Başlık (Örn: A Blok Temel) */}
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">
                      {sheet.groupName}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-6 pl-10 md:pl-0">
                   <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Toplam</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatNumber(sheet.totalAmount)} <span className="text-sm font-normal text-gray-400">{sheet.unit}</span>
                      </p>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDeleteSheet(sheet.id); }}
                     className="p-2 text-gray-300 hover:text-red-500 transition rounded-full hover:bg-red-50"
                     title="Cetveli Sil"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>

              {/* TABLE (Metraj Satırları) */}
              {isExpanded && (
                <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b">
                        <tr>
                          <th className="px-4 py-3 w-10 text-center">#</th>
                          <th className="px-4 py-3">Açıklama</th>
                          <th className="px-2 py-3 w-24 text-center">En</th>
                          <th className="px-2 py-3 w-24 text-center">Boy</th>
                          <th className="px-2 py-3 w-24 text-center">Yük.</th>
                          <th className="px-2 py-3 w-20 text-center bg-yellow-50/50 text-yellow-700">Adet</th>
                          <th className="px-4 py-3 w-32 text-right bg-blue-50/50 text-blue-700">Ara Toplam</th>
                          <th className="px-2 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sheet.measurements.map((row, idx) => (
                          <tr key={row.id} className="group hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 py-2 text-center text-gray-400 text-xs">{idx + 1}</td>
                            <td className="p-1">
                              <input 
                                type="text" 
                                className="w-full px-3 py-1.5 rounded border border-transparent focus:border-blue-400 focus:bg-white focus:shadow-sm bg-transparent outline-none transition-all placeholder-gray-300"
                                placeholder="Metraj açıklaması..."
                                value={row.description}
                                onChange={(e) => handleUpdateRow(sheet.id, row.id, 'description', e.target.value)}
                              />
                            </td>
                            {['width', 'length', 'height'].map((field) => (
                              <td key={field} className="p-1">
                                <input 
                                  type="number" 
                                  className="w-full px-2 py-1.5 text-center font-mono rounded border border-transparent focus:border-blue-400 focus:bg-white bg-transparent outline-none transition-all placeholder-gray-200 text-gray-600"
                                  placeholder="-"
                                  value={row[field as keyof Measurement] ?? ''}
                                  onChange={(e) => handleUpdateRow(sheet.id, row.id, field as keyof Measurement, parseFloat(e.target.value))}
                                />
                              </td>
                            ))}
                            <td className="p-1 bg-yellow-50/30">
                              <input 
                                type="number" 
                                className="w-full px-2 py-1.5 text-center font-mono font-bold text-gray-800 rounded border border-transparent focus:border-yellow-400 focus:bg-white bg-transparent outline-none transition-all"
                                value={row.count}
                                onChange={(e) => handleUpdateRow(sheet.id, row.id, 'count', parseFloat(e.target.value))}
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                              {formatNumber(row.subtotal)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button onClick={() => handleDeleteRow(sheet.id, row.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button 
                    onClick={() => handleAddRow(sheet.id)}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider border-t border-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Yeni Satır Ekle
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* --- YENİ CETVEL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderPlus size={20} className="text-blue-400" /> Yeni Metraj Cetveli
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Bölüm Adı */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cetvel / Bölüm Adı <span className="text-red-500">*</span></label>
                <input 
                  type="text" autoFocus
                  value={formData.groupName}
                  onChange={e => setFormData({...formData, groupName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg font-medium"
                  placeholder="Örn: A Blok Temel, B Blok Duvarlar..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Poz No</label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="15.120..."
                    />
                 </div>
                 <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Poz Tanımı</label>
                    <input 
                      type="text" 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Hazır Beton Dökülmesi..."
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
                  <input 
                    type="text" 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birim Fiyat (TL)</label>
                  <input 
                    type="number" 
                    value={formData.unitPrice}
                    onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                <div className="col-span-2 text-[10px] text-gray-400">
                  * Poz No ve Fiyat bilgileri Hakediş Özeti sayfasında gruplama yapmak için kullanılacaktır.
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm">İptal</button>
              <button 
                onClick={handleSaveSheet}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Save size={18} /> OLUŞTUR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};