import React, { useState, useEffect, useRef } from 'react';
import { MeasurementSheet, ProjectInfo, TabView, CoverData } from './types';
import { InputSection } from './components/InputSection';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentCover } from './components/PaymentCover';
import { PrintReport } from './components/PrintReport';
import { ProjectSettings } from './components/ProjectSettings';
import { GreenBook } from './components/GreenBook';
import { ProjectsTab } from './components/ProjectsTab';
import { supabase } from './components/supabase';
import {
  Printer, LayoutDashboard, ClipboardList, BookOpenCheck, Settings, AlertTriangle, Building2, Save, FolderOpen, Loader2, BookOpen
} from 'lucide-react';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [authMessage, setAuthMessage] = useState<string>('');

  // --- ACCOUNT VE PROJE YÖNETİMİ ---
  const [accountId, setAccountId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let apiKey = urlParams.get('apiKey');

      if (apiKey) {
        localStorage.setItem('hakedis_api_key', apiKey);
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', newUrl);
      } else {
        apiKey = localStorage.getItem('hakedis_api_key');
      }

      if (!apiKey) {
        setAuthStatus('error');
        setAuthMessage("Oturum bulunamadı. Lütfen ana sayfa üzerinden giriş yapın.");
        return;
      }

      try {
        if (apiKey === "admin") {
          setAuthStatus('success');
          setAccountId("admin");
          return;
        }

        const response = await fetch(`https://www.celikyucel.com/_functions/validateKey`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        if (data.valid === true) {
          setAuthStatus('success');
          setAccountId(data.memberId ? data.memberId : apiKey);
        } else {
          localStorage.removeItem('hakedis_api_key');
          setAuthStatus('error');
          setAuthMessage(data.message || "Oturumunuzun süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.");
        }
      } catch (error) {
        console.error("Doğrulama hatası:", error);
        setAuthStatus('error');
        setAuthMessage("Sistem doğrulaması şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.");
      }
    };
    checkAccess();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Kaydedilmemiş değişiklikleriniz var. Ayrılmak istediğinize emin misiniz?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // --- MEVCUT STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState<TabView | 'projects'>('input');
  const [previousQuantities, setPreviousQuantities] = useState<Record<string, number>>({});
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    projectName: 'ORNEK KONUT PROJESİ İNŞAATI',
    contractor: 'DEMİR İNŞAAT TAAHHÜT LTD. ŞTİ.',
    employer: 'BÜYÜKŞEHİR BELEDİYESİ',
    period: '1 NOLU HAKEDİŞ',
    date: new Date().toISOString().split('T')[0],
    signatories: [
      { title: 'YÜKLENİCİ', name: '' },
      { title: 'KONTROL MÜHENDİSİ', name: '' },
      { title: 'ONAYLAYAN', name: '' }
    ]
  });

  const [coverData, setCoverData] = useState<CoverData>({
    kdvRate: 20,
    extraPayments: [],
    deductions: []
  });

  const [sheets, setSheets] = useState<MeasurementSheet[]>([]);

  // Değişiklik Algılayıcı (isDirty Flag)
// Sayfanın ilk defa yüklenip yüklenmediğini takip etmek için
  const isInitialMount = useRef(true);

  // Değişiklik Algılayıcı (isDirty Flag)
  useEffect(() => {
    // Eğer ilk yüklenmeyse, pas geç ve durumu false yap
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (authStatus === 'success') {
      setIsDirty(true);
    }
  }, [projectInfo, sheets, coverData, previousQuantities]); // authStatus'u buradan çıkardık ki giriş yapıldığı an tetiklenmesin

  // --- FARKLI KAYDET (YENİ PROJE OLARAK KAYDET) ---
  const handleSaveAsNewProject = async () => {
    if (!accountId) {
      alert("Oturum bilginiz bulunamadı.");
      return;
    }

    const newProjectName = prompt(
      "Yeni proje olarak kaydetmek için bir isim girin:", 
      `${projectInfo.projectName} (Kopya)`
    );

    if (!newProjectName || newProjectName.trim() === '') return;

    setIsSaving(true);
    
    const updatedProjectInfo = { ...projectInfo, projectName: newProjectName };
    const projectDataToSave = { 
      projectInfo: updatedProjectInfo, 
      sheets, 
      coverData, 
      previousQuantities 
    };

    try {
      const { count, error: countError } = await supabase
        .from('hakedis_projects')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);

      if (countError) throw countError;

      if (count !== null && count >= 20) {
        alert("Maksimum proje limitine (10 adet) ulaştınız. Lütfen eski bir projeyi silin.");
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase.from('hakedis_projects').insert([{
        account_id: accountId,
        project_name: updatedProjectInfo.projectName,
        period: updatedProjectInfo.period,
        project_data: projectDataToSave
      }]).select();

      if (error || !data || data.length === 0) throw error || new Error("Kayıt oluşturulamadı");
      
      setCurrentProjectId(data[0].id);
      setProjectInfo(updatedProjectInfo);
      setIsDirty(false);
      alert("Proje başarıyla YENİ BİR PROJE olarak kaydedildi!");

    } catch (error) {
      console.error("Farklı kaydetme hatası:", error);
      alert("Proje kaydedilirken bir veritabanı hatası oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- PROJE KAYDETME VEYA ÜZERİNE YAZMA ---
  const handleSaveProject = async () => {
    if (!accountId) {
      alert("Oturum bilginiz bulunamadı.");
      return;
    }

    setIsSaving(true);
    const projectDataToSave = { projectInfo, sheets, coverData, previousQuantities };

    try {
      if (currentProjectId) {
        const { error } = await supabase.from('hakedis_projects').update({
          project_name: projectInfo.projectName,
          period: projectInfo.period,
          project_data: projectDataToSave,
          updated_at: new Date().toISOString()
        }).eq('id', currentProjectId);

        if (error) throw error;
        setIsDirty(false);
        alert("Proje değişiklikleri başarıyla kaydedildi!");
      }
      else {
        const { count, error: countError } = await supabase
          .from('hakedis_projects')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', accountId);

        if (countError) throw countError;

        if (count !== null && count >= 20) {
          alert("Maksimum proje limitine (10 adet) ulaştınız. Lütfen eski bir projeyi silin.");
          setIsSaving(false);
          return;
        }

        const { data, error } = await supabase.from('hakedis_projects').insert([{
          account_id: accountId,
          project_name: projectInfo.projectName,
          period: projectInfo.period,
          project_data: projectDataToSave
        }]).select();

        if (error || !data || data.length === 0) throw error || new Error("Kayıt oluşturulamadı");
        
        setCurrentProjectId(data[0].id);
        setIsDirty(false);
        alert("Proje başarıyla buluta kaydedildi!");
      }
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert("Proje kaydedilirken bir veritabanı hatası oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if(confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      localStorage.removeItem('hakedis_api_key');
      window.location.href = "https://www.celikyucel.com"; 
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white p-6 rounded shadow border border-slate-200 text-center">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={32} />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Erişim Hatası</h2>
          <p className="text-sm text-slate-500 mb-6">{authMessage}</p>
          <a href="https://www.celikyucel.com" className="inline-block bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-700 w-full">Ana Sayfaya Dön</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans text-sm selection:bg-blue-200 print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 no-print border-r border-slate-800 z-20 shadow-lg">
        {/* Header / Logo */}
        <div className="h-14 flex items-center gap-3 px-4 bg-slate-950 border-b border-slate-800">
          <img
            src="https://static.wixstatic.com/media/0ded6e_72f80a47c7854648ad37f65c0c5c9288~mv2.png/v1/crop/x_87,y_63,w_270,h_309/fill/w_84,h_98,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/site%20logo%20yal%C4%B1n_edited_png%20Kopyas%C4%B1.png"
            alt="Logo"
            className="h-6 w-auto bg-white rounded-sm p-0.5 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm tracking-wide leading-none">Hakediş Pro</span>
            <span className="text-[9px] text-slate-500 mt-0.5">Masaüstü Sürüm</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">

          {/* BULUT / PROJELER KISMI */}
          <div className="pb-2 border-b border-slate-800 mb-2">
            <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-400 hover:bg-slate-800 hover:text-white'}`}>
              <FolderOpen size={16} /> Kayıtlı Projelerim
            </button>
          </div>

          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'settings' ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Settings size={16} /> Proje Ayarları
          </button>

          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Veri Girişi</p>
            <button onClick={() => setActiveTab('input')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'input' ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard size={16} /> Metraj Cetvelleri
            </button>
          </div>

          <div className="pt-2 pb-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Raporlar</p>

            <button onClick={() => setActiveTab('greenbook')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'greenbook' ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
              <BookOpen size={16} /> Yeşil Defter
            </button>

            <button onClick={() => setActiveTab('summary')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'summary' ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
              <ClipboardList size={16} /> İcmal (Hakediş Özeti)
            </button>
            <button onClick={() => setActiveTab('cover')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'cover' ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
              <BookOpenCheck size={16} /> Arka Kapak (Kapak)
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-2">
            <button onClick={() => setActiveTab('report')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition text-xs font-medium ${activeTab === 'report' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              <div className="flex items-center gap-3"><Printer size={16} /> Raporla & Yazdır</div>
            </button>
            <button onClick={handleLogout} className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-md transition text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300">
              <AlertTriangle size={16} /> Çıkış Yap
            </button>
          </div>
        </nav>
      </aside>

      {/* SAĞ ÇALIŞMA ALANI */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative print:block print:h-auto print:overflow-visible print:bg-white">
        
        {/* Windows Title Bar Hissi (Durum Çubuğu) */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 no-print shadow-sm z-10">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 size={16} className="text-blue-500" />
            <span>Aktif Proje:</span>
            <span className="font-bold text-slate-800 text-sm">{projectInfo.projectName || 'İsimsiz Proje'}</span>
            {currentProjectId && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">BULUTA KAYITLI</span>}
          </div>

          {/* KAYDET BUTONLARI */}
          <div className="flex items-center gap-2">
            {currentProjectId && (
              <button
                onClick={handleSaveAsNewProject}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition text-xs font-bold shadow bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                title="Bu projeyi şablon olarak kullanıp yeni bir isimle kopyala"
              >
                <FolderOpen size={16} /> Farklı Kaydet
              </button>
            )}

            <button
              onClick={handleSaveProject}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-xs font-bold shadow ${isDirty && !isSaving
                ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                } text-white`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isDirty && currentProjectId ? "Üzerine Yaz (Güncelle) *" : (isDirty ? "Değişiklikleri Kaydet *" : "Projeyi Kaydet")}
            </button>
          </div>
        </header>

        {/* İçerik (Kaydırılabilir Alan) */}
        <div className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth print:overflow-visible print:p-0">
          <div className="max-w-6xl mx-auto print:max-w-none print:m-0">
            {activeTab === 'projects' && accountId && (
              <ProjectsTab
                accountId={accountId}
                isDirty={isDirty}
                setIsDirty={setIsDirty} 
                setCurrentProjectId={setCurrentProjectId}
                setProjectInfo={setProjectInfo}
                setSheets={setSheets}
                setCoverData={setCoverData}
                setPreviousQuantities={setPreviousQuantities}
                setActiveTab={setActiveTab}
              />
            )}
            
            {activeTab === 'settings' && (
              <ProjectSettings projectInfo={projectInfo} setProjectInfo={setProjectInfo} />
            )}
            
            {activeTab === 'input' && (
              <InputSection items={sheets} setItems={setSheets} />
            )}
            
            {activeTab === 'greenbook' && (
              <GreenBook
                sheets={sheets}
                projectInfo={projectInfo}
                previousQuantities={previousQuantities}
                setPreviousQuantities={setPreviousQuantities}
                accountId={accountId}
                coverData={coverData}
              />
            )}            
            
            {activeTab === 'summary' && (
              <PaymentSummary 
                sheets={sheets} 
                previousQuantities={previousQuantities} 
                setPreviousQuantities={setPreviousQuantities} 
                projectInfo={projectInfo} 
              />
            )}
            
            {activeTab === 'cover' && (
              <PaymentCover 
                sheets={sheets} 
                previousQuantities={previousQuantities} 
                projectInfo={projectInfo} 
                coverData={coverData} 
                setCoverData={setCoverData} 
              />
            )}
            
            {activeTab === 'report' && (
              <PrintReport
                sheets={sheets}
                projectInfo={projectInfo}
                previousQuantities={previousQuantities}
                coverData={coverData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;