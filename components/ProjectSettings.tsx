import React from 'react';
import { ProjectInfo, Signatory } from '../types';
import { Save, Building2, Calendar, FileText, Briefcase, Plus, Trash2, PenTool } from 'lucide-react';

interface Props {
  projectInfo: ProjectInfo;
  setProjectInfo: React.Dispatch<React.SetStateAction<ProjectInfo>>;
}

export const ProjectSettings: React.FC<Props> = ({ projectInfo, setProjectInfo }) => {
  
  const handleChange = (field: keyof ProjectInfo, value: any) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  // İmza Yetkilisi İşlemleri
  const handleSignatoryChange = (index: number, field: keyof Signatory, value: string) => {
    const newSignatories = [...(projectInfo.signatories || [])];
    newSignatories[index] = { ...newSignatories[index], [field]: value };
    setProjectInfo(prev => ({ ...prev, signatories: newSignatories }));
  };

  const addSignatory = () => {
    setProjectInfo(prev => ({
      ...prev,
      signatories: [...(prev.signatories || []), { title: 'YENİ İMZA', name: '' }]
    }));
  };

  const removeSignatory = (index: number) => {
    setProjectInfo(prev => ({
      ...prev,
      signatories: (prev.signatories || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* Üst Kısım Aynen Kalıyor... */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Building2 className="text-blue-600" size={28} />
          Proje ve Firma Bilgileri
        </h2>
        <p className="text-gray-500 mt-2">
          Bu bilgiler tüm raporların başlığında ve imza bölümlerinde otomatik olarak kullanılacaktır.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="font-bold text-lg text-gray-700 border-b pb-2 flex items-center gap-2">
            <FileText size={20} /> Proje Tanımı
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Proje Adı</label>
            <textarea 
              value={projectInfo.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Dönem</label>
                <input value={projectInfo.period} onChange={(e)=>handleChange('period', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
             </div>
             <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Tarih</label>
                <input type="date" value={projectInfo.date} onChange={(e)=>handleChange('date', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
             </div>
          </div>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="font-bold text-lg text-gray-700 border-b pb-2 flex items-center gap-2">
              <Briefcase size={20} /> Taraflar
            </h3>
            <div>
               <label className="block text-sm font-semibold text-gray-600 mb-1">Yüklenici</label>
               <input value={projectInfo.contractor} onChange={(e)=>handleChange('contractor', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
               <label className="block text-sm font-semibold text-gray-600 mb-1">İdare</label>
               <input value={projectInfo.employer} onChange={(e)=>handleChange('employer', e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
         </div>
      </div>

      {/* --- YENİ EKLENEN BÖLÜM: İMZA YETKİLİLERİ --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
            <PenTool size={20} /> İmza Yetkilileri
          </h3>
          <button 
            onClick={addSignatory}
            className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg font-bold transition flex items-center gap-1"
          >
            <Plus size={16} /> Ekle
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Bu alana eklediğiniz kişiler tüm raporların en altında imza bloğu olarak açılacaktır. 
          Sıralama soldan sağa doğrudur.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projectInfo.signatories || []).map((sig, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-lg relative group">
              <button 
                onClick={() => removeSignatory(index)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition"
                title="Kaldır"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unvan / Görev</label>
                  <input 
                    type="text" 
                    value={sig.title}
                    onChange={(e) => handleSignatoryChange(index, 'title', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold text-gray-800"
                    placeholder="Örn: KONTROL MÜHENDİSİ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ad Soyad (Opsiyonel)</label>
                  <input 
                    type="text" 
                    value={sig.name}
                    onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    placeholder="İsim girilmezse boş çıkar"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 hover:bg-green-700 transition cursor-default">
          <Save size={20} /> Değişiklikler Kaydedildi
        </button>
      </div>

    </div>
  );
};