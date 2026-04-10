import React, { useState, useEffect } from 'react';
import { MeasurementSheet, Measurement } from '../types';
import { generateId, formatNumber, calculateMeasurementRow } from '../utils';
import { supabase } from './supabase';
import { 
  Plus, Trash2, Pencil, ChevronDown, ChevronRight, FileSpreadsheet, X, 
  Search, Loader2, AlertTriangle, Check, ListChecks, GripVertical 
} from 'lucide-react';

// --- DND-KIT IMPORTS ---
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  items: MeasurementSheet[];
  setItems: React.Dispatch<React.SetStateAction<MeasurementSheet[]>>;
}

// --- SÜRÜKLENEBİLİR CETVEL BİLEŞENİ (YENİ) ---
interface SortableSheetItemProps {
  sheet: MeasurementSheet;
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  handleDeleteSheet: (id: string) => void;
  openEditSheetModal: (sheet: MeasurementSheet) => void;
  handleUpdateRow: (sheetId: string, rowId: string, field: keyof Measurement, value: any) => void;
  handleDeleteRow: (sheetId: string, rowId: string) => void;
  handleAddRow: (sheetId: string) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>, sheetId: string, startIndex: number) => void;
}

const SortableSheetItem: React.FC<SortableSheetItemProps> = ({
  sheet, isExpanded, toggleExpand, handleDeleteSheet, openEditSheetModal, 
  handleUpdateRow, handleDeleteRow, handleAddRow, handlePaste
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sheet.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border ${isDragging ? 'border-blue-400 shadow-lg' : 'border-slate-200'} rounded shadow-sm overflow-hidden text-xs mb-3`}>
      <div className={`flex items-center justify-between p-2 cursor-pointer select-none hover:bg-slate-50 ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : ''}`} onClick={() => toggleExpand(sheet.id)}>
        <div className="flex items-center gap-2">
          {/* DRAG HANDLE (TUTMA YERİ) */}
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing hover:text-blue-500 text-slate-300 p-1 rounded hover:bg-slate-200 transition" 
            onClick={(e) => e.stopPropagation()}
            title="Sürükleyip Sıralamayı Değiştirin"
          >
            <GripVertical size={16} />
          </div>
          <div className="text-slate-400">{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
          <span className="font-mono bg-slate-200 text-slate-700 px-1 py-0.5 rounded text-[10px]">{sheet.code}</span>
          <span className="font-bold text-slate-800">{sheet.groupName}</span>
          <span className="text-slate-400 truncate max-w-[200px] text-[10px] hidden sm:inline">({sheet.description})</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase">Top:</span>
            <span className="font-bold text-blue-700 text-sm">{formatNumber(sheet.totalAmount)}</span>
            <span className="text-[10px] text-slate-500">{sheet.unit}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEditSheetModal(sheet); }} className="text-slate-400 hover:text-blue-500 transition p-1" title="Düzenle"><Pencil size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDeleteSheet(sheet.id); }} className="text-slate-400 hover:text-red-500 transition p-1" title="Sil"><Trash2 size={14} /></button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-2 py-1.5 w-8 text-center border-r border-slate-200">#</th>
                <th className="px-2 py-1.5 border-r border-slate-200">Açıklama / İmalat Yeri</th>
                {sheet.type === 'rebar' ? (
                  <>
                    <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200 text-blue-800">Çap (Ø)</th>
                    <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200 text-blue-800">Boy (L)</th>
                    <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200">B.Ağır.</th>
                  </>
                ) : (
                  <>
                    <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200">En</th>
                    <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200">Boy</th>
                    <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200">Yük.</th>
                  </>
                )}
                <th className="px-1 py-1.5 w-16 text-center border-r border-slate-200">Adet</th>
                <th className="px-2 py-1.5 w-24 text-right border-r border-slate-200">{sheet.type === 'rebar' ? 'Ağırlık' : 'Miktar'}</th>
                <th className="px-1 py-1.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sheet.measurements.map((row, idx) => (
                <tr key={row.id} className="hover:bg-blue-50/50 border-b border-slate-100 last:border-0 group">
                  <td className="px-2 py-1 text-center text-slate-400 border-r border-slate-100">{idx + 1}</td>
                  <td className="p-0 border-r border-slate-100 relative">
                    <input
                      type="text"
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-400"
                      placeholder="Açıklama"
                      value={row.description}
                      onChange={(e) => handleUpdateRow(sheet.id, row.id, 'description', e.target.value)}
                      onPaste={(e) => handlePaste(e, sheet.id, idx)}
                    />
                  </td>
                  {(sheet.type === 'rebar' ? ['diameter', 'length', 'unitWeight'] : ['width', 'length', 'height']).map((field) => (
                    <td key={field} className={`p-0 border-r border-slate-100 ${sheet.type === 'rebar' && field === 'diameter' ? 'bg-blue-50/30' : ''}`}>
                      <input
                        type="number"
                        className="w-full h-full px-1 py-1.5 text-center font-mono bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-blue-400"
                        placeholder={field === 'unitWeight' ? 'Oto' : '-'}
                        value={row[field as keyof Measurement] ?? ''}
                        onChange={(e) => handleUpdateRow(sheet.id, row.id, field as keyof Measurement, e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                        onPaste={(e) => handlePaste(e, sheet.id, idx)}
                      />
                    </td>
                  ))}
                  <td className="p-0 border-r border-slate-100 bg-yellow-50/20">
                    <input
                      type="number"
                      className={`w-full h-full px-1 py-1.5 text-center font-mono font-bold outline-none focus:bg-white focus:ring-1 focus:ring-yellow-400 ${row.count < 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-800 bg-transparent'}`}
                      value={row.count}
                      onChange={(e) => handleUpdateRow(sheet.id, row.id, 'count', e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                      onPaste={(e) => handlePaste(e, sheet.id, idx)}
                    />
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono font-bold border-r border-slate-100 ${row.subtotal < 0 ? 'text-red-600 bg-red-50/50' : 'text-blue-700 bg-blue-50/30'}`}>{formatNumber(row.subtotal)}</td>
                  <td className="px-1 py-1 text-center"><button onClick={() => handleDeleteRow(sheet.id, row.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-200 bg-slate-50">
            <button onClick={() => handleAddRow(sheet.id)} className="w-full py-1.5 text-slate-500 text-[10px] font-bold uppercase hover:bg-slate-200 transition flex justify-center items-center gap-1">
              <Plus size={12} /> Satır Ekle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const InputSection: React.FC<Props> = ({ items, setItems }) => {
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinhaModalOpen, setIsMinhaModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [priceType, setPriceType] = useState<'dahil' | 'montaj'>('dahil');
  const [isRebarSuggested, setIsRebarSuggested] = useState(false);
  const [selectedSheetType, setSelectedSheetType] = useState<'standard' | 'rebar'>('standard');
  const [availablePrices, setAvailablePrices] = useState<{ dahil: number, montaj: number } | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ groupName: '', code: '', description: '', unit: 'm2', unitPrice: 0 });

  // --- DND-KIT SENSÖRLERİ ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Tıklama ile sürüklemeyi ayırmak için 5px hareket zorunluluğu
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const textToAnalyze = `${formData.groupName} ${formData.description}`.toLocaleLowerCase('tr-TR');
    if (textToAnalyze.includes('demir') || textToAnalyze.includes('donatı') || textToAnalyze.includes('nervürlü')) {
      setIsRebarSuggested(true);
    } else {
      setIsRebarSuggested(false);
    }
  }, [formData.groupName, formData.description]);

  const toggleExpand = (id: string) => setExpandedSheets(prev => ({ ...prev, [id]: !prev[id] }));

  const openNewSheetModal = () => {
    setEditingSheetId(null);
    setFormData({ groupName: '', code: '', description: '', unit: 'm2', unitPrice: 0 });
    setSearchTerm(''); setSearchResults([]); setIsModalOpen(true);
    setIsRebarSuggested(false); setSelectedSheetType('standard');
    setAvailablePrices(null); setPriceType('dahil');
  };

  const openEditSheetModal = (sheet: MeasurementSheet) => {
    setEditingSheetId(sheet.id);
    setFormData({
      groupName: sheet.groupName, code: sheet.code, description: sheet.description,
      unit: sheet.unit, unitPrice: sheet.unitPrice
    });
    setSelectedSheetType(sheet.type || 'standard');
    setIsModalOpen(true);
  };

  const handleSearchPoz = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.from('poz2026').select('*').or(`poz.ilike.%${searchTerm}%,tanim.ilike.%${searchTerm}%`).limit(20);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) { console.error(error); alert("Hata oluştu."); } finally { setIsSearching(false); }
  };

  const handleSelectPoz = (item: any) => {
    const vals = [String(item.deger1 || '').trim().replace(',', '.'), String(item.deger2 || '').trim().replace(',', '.'), String(item.deger3 || '').trim().replace(',', '.')];
    const numbers: number[] = []; const texts: string[] = [];
    vals.forEach(val => { if (val === '') return; const num = parseFloat(val); if (!isNaN(num)) numbers.push(num); else texts.push(val); });

    let priceDahil = 0; let priceMontaj = 0; let unit = 'm2';
    if (numbers.length >= 2) {
      numbers.sort((a, b) => a - b);
      priceMontaj = numbers[0]; priceDahil = numbers[numbers.length - 1];
      if (texts.length > 0) unit = texts[0];
    } else if (numbers.length === 1) {
      priceDahil = numbers[0]; priceMontaj = numbers[0];
      if (texts.length > 0) unit = texts[0];
    }

    setFormData({ ...formData, code: item.poz || '', description: item.tanim || '', unit: unit, unitPrice: priceDahil });

    if (priceDahil !== priceMontaj && priceMontaj > 0) {
      setAvailablePrices({ dahil: priceDahil, montaj: priceMontaj });
      setPriceType('dahil');
    } else {
      setAvailablePrices(null);
    }
    setSearchResults([]); setSearchTerm('');
  };

  const handlePriceTypeChange = (type: 'dahil' | 'montaj') => {
    setPriceType(type);
    if (availablePrices) {
      setFormData(prev => ({ ...prev, unitPrice: type === 'dahil' ? availablePrices.dahil : availablePrices.montaj }));
    }
  };

  const handleSaveSheet = () => {
    if (!formData.groupName) return;

    if (editingSheetId) {
      setItems(prev => prev.map(s =>
        s.id === editingSheetId
          ? {
            ...s, groupName: formData.groupName, code: formData.code || 'Genel',
            description: formData.description || '', unit: formData.unit,
            unitPrice: Number(formData.unitPrice), type: selectedSheetType,
            calculatedCost: s.totalAmount * Number(formData.unitPrice)
          } : s
      ));
    } else {
      const newSheet: MeasurementSheet = {
        id: generateId(), type: selectedSheetType, groupName: formData.groupName,
        code: formData.code || 'Genel', description: formData.description || '',
        unit: formData.unit, unitPrice: Number(formData.unitPrice), measurements: [],
        totalAmount: 0, calculatedCost: 0
      };
      setItems(prev => [...prev, newSheet]);
      setExpandedSheets(prev => ({ ...prev, [newSheet.id]: true }));
    }
    setIsModalOpen(false); setEditingSheetId(null);
  };

  const recalculateSheet = (sheet: MeasurementSheet, newMeasurements: Measurement[]): MeasurementSheet => {
    const totalAmount = newMeasurements.reduce((acc, curr) => acc + curr.subtotal, 0);
    return { ...sheet, measurements: newMeasurements, totalAmount, calculatedCost: totalAmount * sheet.unitPrice };
  };

  const handleAddRow = (sheetId: string) => {
    setItems(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      return recalculateSheet(sheet, [...sheet.measurements, { id: generateId(), description: '', width: undefined, length: undefined, height: undefined, count: 1, subtotal: 0 }]);
    }));
  };

  const handleDeleteRow = (sheetId: string, rowId: string) => {
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
        updatedRow.subtotal = calculateMeasurementRow(updatedRow, sheet.type);
        return updatedRow;
      });
      return recalculateSheet(sheet, newMeasurements);
    }));
  };

  const handleDeleteSheet = (id: string) => {
    if (confirm("Silmek istediğinize emin misiniz?")) setItems(prev => prev.filter(s => s.id !== id));
  };

  const minhaRows = items.flatMap(sheet =>
    sheet.measurements
      .filter(m => m.description.toLocaleLowerCase('tr-TR').includes('minha') && m.count > 0)
      .map(m => ({ sheetId: sheet.id, sheetName: sheet.groupName, row: m }))
  );

  const handleBulkMinha = () => {
    setItems(prev => prev.map(sheet => {
      let isModified = false;
      const newMeasurements = sheet.measurements.map(m => {
        if (m.description.toLocaleLowerCase('tr-TR').includes('minha') && m.count > 0) {
          isModified = true;
          const updatedCount = -Math.abs(m.count);
          const w = m.width ?? 1; const l = m.length ?? 1; const h = m.height ?? 1;
          const hasDimensions = m.width !== undefined || m.length !== undefined || m.height !== undefined;
          return { ...m, count: updatedCount, subtotal: hasDimensions ? (w * l * h * updatedCount) : 0 };
        }
        return m;
      });

      if (isModified) {
        const totalAmount = newMeasurements.reduce((acc, curr) => acc + curr.subtotal, 0);
        return { ...sheet, measurements: newMeasurements, totalAmount, calculatedCost: totalAmount * sheet.unitPrice };
      }
      return sheet;
    }));
    setIsMinhaModalOpen(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, sheetId: string, startIndex: number) => {
    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData || (!clipboardData.includes('\t') && !clipboardData.includes('\n'))) return;
    e.preventDefault();

    const rows = clipboardData.split(/\r?\n/).filter(row => row.trim() !== '');

    setItems(prev => prev.map(sheet => {
      if (sheet.id !== sheetId) return sheet;
      const newMeasurements = [...sheet.measurements];
      let currentIndex = startIndex;

      rows.forEach((rowStr) => {
        const cols = rowStr.split('\t');
        const parseNum = (val: string) => {
          if (!val || val.trim() === '') return undefined;
          const parsed = parseFloat(val.replace(/\./g, '').replace(',', '.'));
          return isNaN(parsed) ? undefined : parsed;
        };

        const desc = cols[0] !== undefined ? cols[0].trim() : '';
        const c = parseNum(cols[4]) ?? 1;

        let newRowData: any = { description: desc, count: cols[4] ? c : undefined };

        if (sheet.type === 'rebar') {
          newRowData.diameter = parseNum(cols[1]); newRowData.length = parseNum(cols[2]); newRowData.unitWeight = parseNum(cols[3]);
        } else {
          newRowData.width = parseNum(cols[1]); newRowData.length = parseNum(cols[2]); newRowData.height = parseNum(cols[3]);
        }

        if (currentIndex < newMeasurements.length) {
          newMeasurements[currentIndex] = {
            ...newMeasurements[currentIndex],
            description: desc || newMeasurements[currentIndex].description,
            ...(sheet.type === 'rebar' ? {
              diameter: newRowData.diameter !== undefined ? newRowData.diameter : newMeasurements[currentIndex].diameter,
              length: newRowData.length !== undefined ? newRowData.length : newMeasurements[currentIndex].length,
              unitWeight: newRowData.unitWeight !== undefined ? newRowData.unitWeight : newMeasurements[currentIndex].unitWeight,
            } : {
              width: newRowData.width !== undefined ? newRowData.width : newMeasurements[currentIndex].width,
              length: newRowData.length !== undefined ? newRowData.length : newMeasurements[currentIndex].length,
              height: newRowData.height !== undefined ? newRowData.height : newMeasurements[currentIndex].height,
            }),
            count: newRowData.count !== undefined ? newRowData.count : newMeasurements[currentIndex].count
          };
        } else {
          newMeasurements.push({ id: generateId(), ...newRowData, count: c });
        }
        newMeasurements[currentIndex].subtotal = calculateMeasurementRow(newMeasurements[currentIndex], sheet.type);
        currentIndex++;
      });

      const totalAmount = newMeasurements.reduce((acc, curr) => acc + curr.subtotal, 0);
      return { ...sheet, measurements: newMeasurements, totalAmount, calculatedCost: totalAmount * sheet.unitPrice };
    }));
  };

  return (
    <div className="space-y-4 relative">
      <div className="bg-white p-3 rounded shadow-sm border border-slate-200 flex justify-between items-center z-10 sticky top-0">
        <div>
          <h2 className="text-base font-bold text-slate-800">Metraj Cetvelleri</h2>
          <p className="text-[11px] text-slate-500">Toplam {items.length} kayıt.</p>
        </div>
        <button onClick={openNewSheetModal} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5">
          <Plus size={14} /> Yeni Ekle
        </button>
      </div>

      {minhaRows.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span className="text-xs font-medium">
              <strong>Uyarı:</strong> Açıklamasında "Minha" kelimesi geçen ancak kesinti (-) olarak işaretlenmemiş <strong>{minhaRows.length}</strong> satır bulundu.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleBulkMinha} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 shadow-sm">
              <Check size={14} /> Tümünü (-) Yap
            </button>
            <button onClick={() => setIsMinhaModalOpen(true)} className="bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 shadow-sm">
              <ListChecks size={14} /> Tek Tek Onayla
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded border border-dashed border-slate-300">
          <FileSpreadsheet size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Veri bulunamadı. Lütfen yeni cetvel ekleyin.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((sheet) => (
              <SortableSheetItem
                key={sheet.id}
                sheet={sheet}
                isExpanded={expandedSheets[sheet.id] || false}
                toggleExpand={toggleExpand}
                handleDeleteSheet={handleDeleteSheet}
                openEditSheetModal={openEditSheetModal}
                handleUpdateRow={handleUpdateRow}
                handleDeleteRow={handleDeleteRow}
                handleAddRow={handleAddRow}
                handlePaste={handlePaste}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* --- MİNHA MODAL (Aynı Kaldı) --- */}
      {isMinhaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col text-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Onay Bekleyen Minha Satırları</h3>
              <button onClick={() => setIsMinhaModalOpen(false)} className="text-amber-600 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 p-1 rounded transition"><X size={16} /></button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="p-3">Cetvel Adı</th>
                    <th className="p-3">Satır Açıklaması</th>
                    <th className="p-3 text-center">Mevcut Adet</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {minhaRows.map((mr, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="p-3 text-xs font-semibold text-slate-700 truncate max-w-[150px]" title={mr.sheetName}>{mr.sheetName}</td>
                      <td className="p-3 text-xs text-slate-600 truncate max-w-[200px]" title={mr.row.description}>{mr.row.description}</td>
                      <td className="p-3 text-xs text-center font-mono font-bold">{mr.row.count}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleUpdateRow(mr.sheetId, mr.row.id, 'count', -Math.abs(mr.row.count))} className="bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white px-3 py-1.5 rounded text-[10px] font-bold transition flex items-center gap-1 ml-auto">
                          <Trash2 size={12} /> Kesinti (-) Yap
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setIsMinhaModalOpen(false)} className="px-5 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded text-xs font-bold transition shadow-sm">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* --- YENİ/DÜZENLE CETVEL MODALI (Aynı Kaldı) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-xl flex flex-col text-sm border border-slate-300">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingSheetId ? 'Cetvel Bilgilerini Düzenle' : 'Yeni Cetvel'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs">
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Poz ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchPoz()} className="flex-1 border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500" />
                  <button onClick={handleSearchPoz} disabled={isSearching} className="bg-slate-700 text-white px-3 py-1 rounded hover:bg-slate-800">{isSearching ? 'Ara...' : 'Ara'}</button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 bg-white max-h-32 overflow-y-auto">
                    <table className="w-full text-left">
                      <tbody>
                        {searchResults.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-2 py-1 font-mono text-[10px]">{r.poz}</td>
                            <td className="px-2 py-1 truncate max-w-[150px]">{r.tanim}</td>
                            <td className="px-2 py-1 text-right"><button onClick={() => handleSelectPoz(r)} className="text-blue-600 font-bold">Seç</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {availablePrices && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded mb-3 flex flex-col gap-2">
                  <span className="text-xs font-bold text-amber-800">Bu poz için birden fazla fiyat bulundu:</span>
                  <div className="flex gap-4 px-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="radio" name="priceType" checked={priceType === 'dahil'} onChange={() => handlePriceTypeChange('dahil')} className="accent-blue-600" /> Malzeme + Montaj ({formatNumber(availablePrices.dahil)} TL)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="radio" name="priceType" checked={priceType === 'montaj'} onChange={() => handlePriceTypeChange('montaj')} className="accent-blue-600" /> Sadece Montaj ({formatNumber(availablePrices.montaj)} TL)
                    </label>
                  </div>
                </div>
              )}

              {isRebarSuggested && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-800">Donatı Metrajı Önerisi</span>
                    <span className="text-[10px] text-blue-600">Bu kalemi donatı çaplarına (Ø) göre hesaplamak ister misiniz?</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setSelectedSheetType('rebar'); setFormData(prev => ({ ...prev, unit: 'kg' })); }} className={`px-3 py-1.5 rounded text-[10px] font-bold transition shadow-sm ${selectedSheetType === 'rebar' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'}`}>Donatı Formu</button>
                    <button onClick={() => setSelectedSheetType('standard')} className={`px-3 py-1.5 rounded text-[10px] font-bold transition shadow-sm ${selectedSheetType === 'standard' ? 'bg-slate-600 text-white' : 'bg-white text-slate-600 border border-slate-300'}`}>Standart</button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cetvel Adı</label>
                <input type="text" value={formData.groupName} onChange={e => setFormData({ ...formData, groupName: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1"><label className="block text-xs text-slate-600 mb-1">Poz No</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full border rounded px-2 py-1 text-xs" /></div>
                <div className="col-span-2"><label className="block text-xs text-slate-600 mb-1">Tanım</label><input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded px-2 py-1 text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-600 mb-1">Birim</label><input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full border rounded px-2 py-1 text-xs" /></div>
                <div><label className="block text-xs text-slate-600 mb-1">Fiyat</label><input type="number" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })} className="w-full border rounded px-2 py-1 text-xs" /></div>
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-3 py-1 text-slate-600 text-xs hover:bg-slate-200 rounded transition">İptal</button>
              <button onClick={handleSaveSheet} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold shadow hover:bg-blue-700 transition">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
