// components/ProjectsTab.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { FolderOpen, Trash2, Clock, AlertCircle, PlusCircle } from 'lucide-react';
import { ProjectInfo, MeasurementSheet, CoverData } from '../types';

interface Props {
  accountId: string;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  setProjectInfo: React.Dispatch<React.SetStateAction<ProjectInfo>>;
  setSheets: React.Dispatch<React.SetStateAction<MeasurementSheet[]>>;
  setCoverData: React.Dispatch<React.SetStateAction<CoverData>>;
  setPreviousQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
}

export const ProjectsTab: React.FC<Props> = ({
  accountId,isDirty,setIsDirty, setCurrentProjectId, setProjectInfo, setSheets, setCoverData, setPreviousQuantities, setActiveTab
}) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hakedis_projects')
      .select('id, project_name, period, created_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [accountId]);

  const loadProject = async (id: string) => {
    if (isDirty) {
      const confirmLeave = confirm("Kaydedilmemiş değişiklikleriniz var. Başka bir projeyi yüklerseniz bu değişiklikler kaybolacaktır. Devam etmek istiyor musunuz?");
      if (!confirmLeave) return;
    }

    const { data, error } = await supabase
      .from('hakedis_projects')
      .select('project_data')
      .eq('id', id)
      .single();

    if (error || !data) {
      alert("Proje yüklenirken bir hata oluştu.");
      return;
    }

    const pd = data.project_data;
    setProjectInfo(pd.projectInfo);
    setSheets(pd.sheets);
    setCoverData(pd.coverData);
    setPreviousQuantities(pd.previousQuantities);
    setCurrentProjectId(id);
    setActiveTab('input'); 

    // YENİ EKLENEN KISIM: 
    // App.tsx'teki değişiklik algılayıcının (useEffect) tetiklenmesini bekleyip 
    // ardından "Kaydet" uyarısını kapatıyoruz (false yapıyoruz).
    setTimeout(() => {
      setIsDirty(false);
    }, 50);
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from('hakedis_projects').delete().eq('id', id);
    if (error) {
      alert("Silinirken hata oluştu.");
    } else {
      fetchProjects();
    }
  };

  const startNewProject = () => {
  const message = isDirty 
    ? "Kaydedilmemiş değişiklikleriniz var. Yeni projeye başlarsanız mevcut veriler silinecektir. Devam edilsin mi?"
    : "Yeni bir projeye başlamak istiyor musunuz?";
    
  if (confirm(message)) {
    window.location.reload();
  }
};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FolderOpen className="text-blue-500" /> Kayıtlı Projelerim
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Hesabınızda kayıtlı projeleriniz ({projects.length}/10)
            </p>
          </div>
          <button onClick={startNewProject} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm transition">
            <PlusCircle size={16} /> Yeni Boş Proje
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Yükleniyor...</div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center">
            <AlertCircle size={32} className="text-slate-400 mb-2" />
            <p className="text-slate-600 font-medium">Henüz kayıtlı projeniz yok.</p>
            <p className="text-slate-400 text-xs mt-1">Üst menüdeki "Kaydet" butonunu kullanarak projelerinizi buluta kaydedebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(proj => (
              <div key={proj.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition group">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{proj.project_name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{proj.period}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(proj.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => loadProject(proj.id)} className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2 rounded text-xs font-bold transition">
                    Yükle
                  </button>
                  <button onClick={() => deleteProject(proj.id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-2 rounded text-xs transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};