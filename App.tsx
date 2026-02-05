import React, { useState, useEffect } from 'react';
import { MeasurementSheet, ProjectInfo, TabView, CoverData } from './types';
import { InputSection } from './components/InputSection';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentCover } from './components/PaymentCover';
import { PrintReport } from './components/PrintReport';
import { ProjectSettings } from './components/ProjectSettings';
import { generateId } from './utils';
import { 
  Printer, LayoutDashboard, ClipboardList, BookOpenCheck, Settings, AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  // --- AUTH STATE (GÜVENLİK KONTROLÜ) ---
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [authMessage, setAuthMessage] = useState<string>('');

  useEffect(() => {
    const checkAccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const apiKey = urlParams.get('apiKey');

      if (!apiKey) {
        setAuthStatus('error');
        setAuthMessage("API anahtarı eksik. Lütfen ana sayfa üzerinden giriş yapın.");
        return;
      }

      try {
        const response = await fetch(`https://www.celikyucel.com/_functions/validateKey?apiKey=${apiKey}`);
        const data = await response.json();

        if (data.valid === true) {
          setAuthStatus('success');
        } else {
          setAuthStatus('error');
          setAuthMessage(data.message || "API anahtarınızın süresi dolmuş veya geçersiz.");
        }
      } catch (error) {
        console.error("Doğrulama hatası:", error);
        setAuthStatus('error');
        setAuthMessage("Sistem doğrulaması şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.");
      }
    };

    checkAccess();
  }, []);

  // --- MEVCUT STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState<TabView>('input');
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

  const [sheets, setSheets] = useState<MeasurementSheet[]>([
    {
      id: generateId(), groupName: 'Seramik Yapılması', code: '15.375.1052', description: '30*30 Seramik Yapılması Mal+İşç',
      unit: 'm2', unitPrice: 639.20, totalAmount: 120, calculatedCost: 76704,
      measurements: [{ id: generateId(), description: 'Mutfak', width: 4, length: 3, height: 0, count: 0, subtotal: 12 }]
    },
    {
      id: generateId(), groupName: 'Sıva Yapılması', code: 'Poz Yok', description: 'Sıva yapılması işçiliği',
      unit: 'm2', unitPrice: 450.00, totalAmount: 500, calculatedCost: 225000,
      measurements: [{ id: generateId(), description: 'Salon', width: 6, length: 0, height: 3, count: 4, subtotal: 72 }]
    }
  ]);

  // --- RENDER MANTIĞI ---

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center border border-gray-200">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erişim Hatası</h2>
          <p className="text-gray-500 mb-8">{authMessage}</p>
          
          <a 
            href="https://www.celikyucel.com" 
            className="inline-block bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-700 transition w-full"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-100">
      
      {/* HEADER GÜNCELLENDİ: LOGO VE LİNK EKLENDİ */}
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo ve Başlık Alanı */}
          <div className="flex items-center w-full md:w-auto">
            <a 
              href="https://www.celikyucel.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
              title="celikyucel.com Ana Sayfasına Git"
            >
              <img 
                src="https://static.wixstatic.com/media/0ded6e_72f80a47c7854648ad37f65c0c5c9288~mv2.png/v1/crop/x_87,y_63,w_270,h_309/fill/w_84,h_98,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/site%20logo%20yal%C4%B1n_edited_png%20Kopyas%C4%B1.png" 
                alt="Logo" 
                className="h-10 w-auto bg-white rounded p-0.5 object-contain"
              />
              <div className="flex flex-col">
                 <h1 className="text-lg font-bold leading-tight group-hover:text-blue-300 transition-colors">Hakediş Pro</h1>
                 <small className="text-[10px] text-gray-400 font-normal">celikyucel.com Uygulaması</small>
              </div>
            </a>
          </div>

          <nav className="flex bg-slate-800 rounded-lg p-1 gap-1 overflow-x-auto max-w-full no-scrollbar">
            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <Settings size={18} /> <span className="hidden sm:inline">Proje Bilgileri</span>
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1 self-center hidden sm:block"></div>
            <button onClick={() => setActiveTab('input')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'input' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <LayoutDashboard size={18} /> <span className="hidden sm:inline">Metraj Girişi</span>
            </button>
            <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'summary' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <ClipboardList size={18} /> <span className="hidden sm:inline">Hakediş Özeti</span>
            </button>
            <button onClick={() => setActiveTab('cover')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'cover' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <BookOpenCheck size={18} /> <span className="hidden sm:inline">Arka Kapak</span>
            </button>
            <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'report' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <Printer size={18} /> <span className="hidden sm:inline">Raporla</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'settings' && (
             <ProjectSettings projectInfo={projectInfo} setProjectInfo={setProjectInfo} />
          )}
          {activeTab === 'input' && (
             <InputSection items={sheets} setItems={setSheets} />
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
            <div className="flex flex-col items-center">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 max-w-4xl no-print w-full flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                  <div>
                    <p className="text-sm text-blue-900 font-bold">Rapor Önizleme Modu</p>
                    <p className="text-xs text-blue-700">Çıktı almak için <span className="font-mono bg-blue-100 px-1 rounded">CTRL+P</span> kısayolunu kullanabilirsiniz.</p>
                  </div>
                  <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 transition">
                    <Printer size={18} /> Yazdır
                  </button>
              </div>
              <PrintReport 
                  sheets={sheets} 
                  projectInfo={projectInfo} 
                  previousQuantities={previousQuantities}
                  coverData={coverData}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;