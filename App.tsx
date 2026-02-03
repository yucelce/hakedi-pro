import React, { useState } from 'react';
import { WorkItem, ProjectInfo, TabView } from './types';
import { InputSection } from './components/InputSection';
import { PrintReport } from './components/PrintReport';
import { generateId } from './utils';
import { Printer, Calculator, Settings, FileText } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<TabView>('input');
  
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    projectName: 'ORNEK KONUT PROJESİ A BLOK İNŞAATI',
    contractor: 'DEMİR İNŞAAT LTD. ŞTİ.',
    employer: 'BÜYÜKŞEHİR BELEDİYESİ FEN İŞLERİ',
    period: '1 NOLU HAKEDİŞ',
    date: new Date().toISOString().split('T')[0]
  });

  // Sample Initial Data
  const [items, setItems] = useState<WorkItem[]>([
    {
      id: generateId(),
      code: '15.120.100',
      description: 'C25/30 Hazır Beton Dökülmesi (Pompalı)',
      unit: 'm3',
      unitPrice: 2450.00,
      previousQuantity: 120,
      measurements: [
        { id: generateId(), description: 'A Blok Temel', width: 12.5, length: 14, height: 0.6, count: 1 },
        { id: generateId(), description: 'Perde Duvarlar', width: 0.25, length: 44, height: 3, count: 1 }
      ]
    },
    {
      id: generateId(),
      code: '15.180.101',
      description: 'Ø8-Ø12 mm Nervürlü Beton Çelik Çubuğu',
      unit: 'ton',
      unitPrice: 28500.00,
      previousQuantity: 4.5,
      measurements: [
        { id: generateId(), description: 'Temel Donatısı', width: 0, length: 0, height: 0, count: 2.3 } // Direct entry
      ]
    }
  ]);

  const [showSettings, setShowSettings] = useState(false);

  // --- Handlers ---
  const handlePrint = () => {
    setActiveTab('report');
    // Allow React to render the report tab first
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Navigation - Hidden on Print */}
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Calculator size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Hakediş Pro</h1>
              <p className="text-xs text-slate-400">Metraj & Hakediş Hesaplama</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('input')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${activeTab === 'input' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <FileText size={18} />
                <span className="hidden sm:inline">Veri Girişi</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${activeTab === 'report' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Printer size={18} />
                <span className="hidden sm:inline">Rapor Önizleme</span>
              </button>
            </nav>

            <button
               onClick={() => setShowSettings(!showSettings)}
               className="p-2 text-slate-400 hover:text-white"
               title="Proje Ayarları"
            >
              <Settings size={20} />
            </button>
            
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition flex items-center gap-2"
            >
              <Printer size={18} />
              Yazdır
            </button>
          </div>
        </div>
      </header>

      {/* Project Settings Modal - Hidden on Print */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center no-print p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Proje Bilgileri</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proje Adı</label>
                <input 
                  type="text" 
                  value={projectInfo.projectName}
                  onChange={(e) => setProjectInfo({...projectInfo, projectName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yüklenici Firma</label>
                <input 
                  type="text" 
                  value={projectInfo.contractor}
                  onChange={(e) => setProjectInfo({...projectInfo, contractor: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İdare / İşveren</label>
                <input 
                  type="text" 
                  value={projectInfo.employer}
                  onChange={(e) => setProjectInfo({...projectInfo, employer: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hakediş Dönemi</label>
                <input 
                  type="text" 
                  value={projectInfo.period}
                  onChange={(e) => setProjectInfo({...projectInfo, period: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input 
                  type="date" 
                  value={projectInfo.date}
                  onChange={(e) => setProjectInfo({...projectInfo, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                Kaydet & Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow bg-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {activeTab === 'input' && (
             <InputSection items={items} setItems={setItems} />
          )}

          {activeTab === 'report' && (
            <div className="flex flex-col items-center">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 max-w-3xl no-print w-full">
                 <div className="flex">
                   <div className="ml-3">
                     <p className="text-sm text-yellow-700">
                       <span className="font-bold">Yazdırma İpucu:</span> En iyi sonuç için tarayıcı yazdırma ayarlarında "Arka plan grafikleri" (Background graphics) seçeneğinin işaretli olduğundan emin olun.
                     </p>
                   </div>
                 </div>
               </div>
              <PrintReport items={items} projectInfo={projectInfo} />
            </div>
          )}

        </div>
      </main>

    </div>
  );
};

export default App;