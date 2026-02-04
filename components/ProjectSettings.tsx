import React from 'react';
import { ProjectInfo } from '../types';
import { Save, Building2, Calendar, FileText, Briefcase } from 'lucide-react';

interface Props {
  projectInfo: ProjectInfo;
  setProjectInfo: React.Dispatch<React.SetStateAction<ProjectInfo>>;
}

export const ProjectSettings: React.FC<Props> = ({ projectInfo, setProjectInfo }) => {
  
  const handleChange = (field: keyof ProjectInfo, value: string) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Başlık Alanı */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Building2 className="text-blue-600" size={28} />
          Proje ve Firma Bilgileri
        </h2>
        <p className="text-gray-500 mt-2">
          Bu alanda girdiğiniz bilgiler; Metraj Cetveli, Hakediş Özeti ve Arka Kapak çıktılarında 
          otomatik olarak başlık ve imza kısımlarında kullanılacaktır.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SOL KOLON - Proje Detayları */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <h3 className="font-bold text-lg text-gray-700 border-b pb-2 flex items-center gap-2">
            <FileText size={20} /> Proje Tanımı
          </h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Proje / İşin Adı</label>
            <textarea 
              value={projectInfo.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              placeholder="Örn: 100 Yataklı Devlet Hastanesi İnşaatı"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Hakediş No / Dönem</label>
              <input 
                type="text" 
                value={projectInfo.period}
                onChange={(e) => handleChange('period', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Örn: 1 Nolu Hakediş"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Düzenleme Tarihi</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={projectInfo.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON - Firma Bilgileri */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <h3 className="font-bold text-lg text-gray-700 border-b pb-2 flex items-center gap-2">
            <Briefcase size={20} /> Taraflar
          </h3>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Yüklenici Firma (Müteahhit)</label>
            <input 
              type="text" 
              value={projectInfo.contractor}
              onChange={(e) => handleChange('contractor', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Örn: Demir İnşaat A.Ş."
            />
            <p className="text-xs text-gray-400 mt-1">Raporların sol alt kısmında imza bloğunda görünür.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">İdare / İşveren Kurum</label>
            <input 
              type="text" 
              value={projectInfo.employer}
              onChange={(e) => handleChange('employer', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Örn: Büyükşehir Belediyesi Fen İşleri"
            />
            <p className="text-xs text-gray-400 mt-1">Raporların sağ alt kısmında onay makamı olarak görünür.</p>
          </div>
        </div>

      </div>

      {/* Kaydet Butonu (Görsel Amaçlı - State zaten anlık güncelleniyor) */}
      <div className="flex justify-end pt-4">
        <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 hover:bg-green-700 transition cursor-default">
          <Save size={20} /> Değişiklikler Kaydedildi
        </button>
      </div>

    </div>
  );
};