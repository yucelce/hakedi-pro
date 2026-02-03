import React, { useState } from 'react';
import { WorkItem, Measurement } from '../types';
import { generateId, calculateMeasurementTotal, formatNumber } from '../utils';
import { Plus, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface InputSectionProps {
  items: WorkItem[];
  setItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

export const InputSection: React.FC<InputSectionProps> = ({ items, setItems }) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const addWorkItem = () => {
    const newItem: WorkItem = {
      id: generateId(),
      code: 'YENİ.POZ',
      description: 'Yeni İş Kalemi',
      unit: 'm3',
      unitPrice: 0,
      previousQuantity: 0,
      measurements: []
    };
    setItems([...items, newItem]);
    setExpandedItemId(newItem.id);
  };

  const removeWorkItem = (id: string) => {
    if (confirm('Bu iş kalemini ve tüm metrajlarını silmek istediğinize emin misiniz?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateWorkItem = (id: string, field: keyof WorkItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addMeasurement = (itemId: string) => {
    const newMeasurement: Measurement = {
      id: generateId(),
      description: 'Blok/Kat Açıklaması',
      width: 0,
      length: 0,
      height: 0,
      count: 1
    };
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, measurements: [...item.measurements, newMeasurement] };
      }
      return item;
    }));
  };

  const updateMeasurement = (itemId: string, mId: string, field: keyof Measurement, value: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedMeasurements = item.measurements.map(m => 
          m.id === mId ? { ...m, [field]: value } : m
        );
        return { ...item, measurements: updatedMeasurements };
      }
      return item;
    }));
  };

  const removeMeasurement = (itemId: string, mId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return { ...item, measurements: item.measurements.filter(m => m.id !== mId) };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Metraj ve Veri Girişi</h2>
        <button
          onClick={addWorkItem}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md"
        >
          <Plus size={20} />
          Yeni Poz Ekle
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg">Henüz bir iş kalemi eklenmedi.</p>
          <p className="text-gray-400">Başlamak için "Yeni Poz Ekle" butonuna tıklayın.</p>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Row */}
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase">Poz No</label>
                <input
                  type="text"
                  value={item.code}
                  onChange={(e) => updateWorkItem(item.id, 'code', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-5">
                <label className="text-xs text-gray-500 font-semibold uppercase">İşin Tanımı</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateWorkItem(item.id, 'description', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-gray-500 font-semibold uppercase">Birim</label>
                <select
                  value={item.unit}
                  onChange={(e) => updateWorkItem(item.id, 'unit', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="m3">m³</option>
                  <option value="m2">m²</option>
                  <option value="mt">mt</option>
                  <option value="adet">adet</option>
                  <option value="ton">ton</option>
                  <option value="kg">kg</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase">Birim Fiyat (TL)</label>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateWorkItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase">Önceki Miktar</label>
                <input
                  type="number"
                  value={item.previousQuantity}
                  onChange={(e) => updateWorkItem(item.id, 'previousQuantity', parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => removeWorkItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
                title="Pozu Sil"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => toggleExpand(item.id)}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded"
              >
                {expandedItemId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {/* Measurements Body */}
          {expandedItemId === item.id && (
            <div className="p-4 bg-gray-50/50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 pl-2 w-1/3">Açıklama (Yer/Konum)</th>
                      <th className="pb-2 w-24">En</th>
                      <th className="pb-2 w-24">Boy</th>
                      <th className="pb-2 w-24">Yükseklik</th>
                      <th className="pb-2 w-20">Adet</th>
                      <th className="pb-2 w-24 text-right">Toplam</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {item.measurements.map((m) => (
                      <tr key={m.id} className="group hover:bg-white">
                        <td className="py-2 pl-2">
                          <input
                            type="text"
                            value={m.description}
                            onChange={(e) => updateMeasurement(item.id, m.id, 'description', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none transition"
                            placeholder="Açıklama..."
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={m.width || ''}
                            onChange={(e) => updateMeasurement(item.id, m.id, 'width', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-transparent border border-gray-200 rounded px-1 text-center"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={m.length || ''}
                            onChange={(e) => updateMeasurement(item.id, m.id, 'length', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-transparent border border-gray-200 rounded px-1 text-center"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={m.height || ''}
                            onChange={(e) => updateMeasurement(item.id, m.id, 'height', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-transparent border border-gray-200 rounded px-1 text-center"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={m.count || ''}
                            onChange={(e) => updateMeasurement(item.id, m.id, 'count', parseFloat(e.target.value) || 0)}
                            className="w-16 bg-transparent border border-gray-200 rounded px-1 text-center"
                          />
                        </td>
                        <td className="py-2 text-right font-mono text-gray-700">
                          {formatNumber(calculateMeasurementTotal(m))}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => removeMeasurement(item.id, m.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => addMeasurement(item.id)}
                  className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={16} /> Satır Ekle
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};