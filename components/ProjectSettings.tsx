import React from 'react';
import { ProjectInfo, Signatory } from '../types';
import { Building2, Plus, Trash2, PenTool, FileText } from 'lucide-react';

interface Props {
  projectInfo: ProjectInfo;
  setProjectInfo: React.Dispatch<React.SetStateAction<ProjectInfo>>;
}

export const ProjectSettings: React.FC<Props> = ({ projectInfo, setProjectInfo }) => {
  const handleChange = (field: keyof ProjectInfo, value: any) => setProjectInfo(prev => ({ ...prev, [field]: value }));
  const handleSignatoryChange = (index: number, field: keyof Signatory, value: string) => {
    const newSignatories = [...(projectInfo.signatories || [])];
    newSignatories[index] = { ...newSignatories[index], [field]: value };
    setProjectInfo(prev => ({ ...prev, signatories: newSignatories }));
  };
  const addSignatory = () => setProjectInfo(prev => ({ ...prev, signatories: [...(prev.signatories || []), { title: 'YENİ İMZA', name: '' }] }));
  const removeSignatory = (index: number) => setProjectInfo(prev => ({ ...prev, signatories: (prev.signatories || []).filter((_, i) => i !== index) }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-sm pb-10">
      
      {/* 1. TEMEL PROJE VE SÖZLEŞME BİLGİLERİ */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
          <Building2 size={20} className="text-blue-600"/> Proje ve Temel Bilgiler
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">İşin (Projenin) Adı</label>
              <input value={projectInfo.projectName} onChange={(e) => handleChange('projectName', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">İdare / İşveren Kurum</label>
              <input value={projectInfo.employer} onChange={(e)=>handleChange('employer', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Yüklenici Firma</label>
              <input value={projectInfo.contractor} onChange={(e)=>handleChange('contractor', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none transition" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Hakediş Dönemi/No</label><input value={projectInfo.period} onChange={(e)=>handleChange('period', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none transition" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tanzim Tarihi</label><input type="date" value={projectInfo.date} onChange={(e)=>handleChange('date', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none transition" /></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">İhale Kayıt No (İKN) <span className="text-[10px] text-slate-400 normal-case font-normal">(Opsiyonel)</span></label>
              <input value={projectInfo.ikn || ''} onChange={(e)=>handleChange('ikn', e.target.value)} placeholder="Örn: 2023/123456" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none font-mono text-xs transition" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SÖZLEŞME VE İLERLEME DETAYLARI (YENİ MODÜL) */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
          <FileText size={20} className="text-emerald-600"/> Sözleşme Künyesi
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Sözleşme Bedeli (KDV Hariç) ₺</label>
            <input 
              type="number" 
              value={projectInfo.contractAmount || ''} 
              onChange={(e)=>handleChange('contractAmount', parseFloat(e.target.value) || undefined)} 
              placeholder="Örn: 5000000" 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono text-emerald-700 font-bold transition bg-emerald-50/30" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Sözleşme Tarihi</label>
            <input type="date" value={projectInfo.contractDate || ''} onChange={(e)=>handleChange('contractDate', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Yer Teslim Tarihi</label>
            <input type="date" value={projectInfo.siteDeliveryDate || ''} onChange={(e)=>handleChange('siteDeliveryDate', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 outline-none transition" />
          </div>
          <div className="md:col-span-4 mt-1">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">İşin Süresi (Takvim Günü)</label>
            <input type="text" value={projectInfo.duration || ''} onChange={(e)=>handleChange('duration', e.target.value)} placeholder="Örn: 120 Gün veya 15.08.2026'ya kadar" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-emerald-500 outline-none transition" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 bg-slate-50 p-3 rounded border border-slate-200">
          * Sözleşme bedeli girdiğinizde, ön kapakta <strong>"Nakdi Gerçekleşme Oranı"</strong> otomatik hesaplanıp resmi formata eklenecektir.
        </p>
      </div>

      {/* 3. İMZA YETKİLİLERİ */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><PenTool size={20} className="text-amber-600" /> İmza Yetkilileri</h3>
          <button onClick={addSignatory} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5"><Plus size={14} /> Yeni Ekle</button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {(projectInfo.signatories || []).map((sig, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-lg relative group">
              <button onClick={() => removeSignatory(index)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Unvan</label>
                  <input type="text" value={sig.title} onChange={(e) => handleSignatoryChange(index, 'title', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ad Soyad</label>
                  <input type="text" value={sig.name} onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" placeholder="Belirtilmedi..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};