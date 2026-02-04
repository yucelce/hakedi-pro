import React, { useState } from 'react';
import { MeasurementSheet, ProjectInfo, TabView } from './types';
import { InputSection } from './components/InputSection';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentCover } from './components/PaymentCover';
import { PrintReport } from './components/PrintReport';
import { ProjectSettings } from './components/ProjectSettings'; // YENİ
import { generateId } from './utils';
import { 
  Printer, Calculator, LayoutDashboard, ClipboardList, BookOpenCheck, Settings
} from 'lucide-react';

const App: React.FC = () => {
  // --- STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState<TabView>('input');
  
  // Hakediş Özeti için Önceki Dönem Miktarları
  const [previousQuantities, setPreviousQuantities] = useState<Record<string, number>>({});

  // Proje Genel Bilgileri
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    projectName: 'ORNEK KONUT PROJESİ İNŞAATI',
    contractor: 'DEMİR İNŞAAT TAAHHÜT LTD. ŞTİ.',
    employer: 'BÜYÜKŞEHİR BELEDİYESİ',
    period: '1 NOLU HAKEDİŞ',
    date: new Date().toISOString().split('T')[0],
    // YENİ: Varsayılan imzalar
    signatories: [
      { title: 'YÜKLENİCİ', name: '' },
      { title: 'KONTROL MÜHENDİSİ', name: '' },
      { title: 'ONAYLAYAN', name: '' }
    ]
  });

  // Metraj Verileri (Örnek Veri ile Başlangıç)
  const [sheets, setSheets] = useState<MeasurementSheet[]>([
    {
      id: generateId(), groupName: 'A Blok Temel', code: '15.120.100', description: 'C25/30 Hazır Beton Dökülmesi',
      unit: 'm3', unitPrice: 2450.00, totalAmount: 120, calculatedCost: 294000,
      measurements: [{ id: generateId(), description: 'Temel Papuçları', width: 12, length: 10, height: 1, count: 1, subtotal: 120 }]
    },
    {
      id: generateId(), groupName: 'Zemin Kat Duvar', code: 'Y.26.005/012', description: '13.5 Luk Tuğla Duvar',
      unit: 'm2', unitPrice: 450.00, totalAmount: 500, calculatedCost: 225000,
      measurements: [{ id: generateId(), description: 'Tüm Odalar', width: 0, length: 0, height: 0, count: 500, subtotal: 500 }]
    }
  ]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-100">
      
      {/* --- HEADER --- */}
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo ve Başlık */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Calculator size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold">Hakediş Pro</h1>
          </div>
          
          {/* Navigasyon */}
          <nav className="flex bg-slate-800 rounded-lg p-1 gap-1 overflow-x-auto max-w-full no-scrollbar">
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              <Settings size={18} /> 
              <span className="hidden sm:inline">Proje Bilgileri</span>
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1 self-center hidden sm:block"></div>

            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'input' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              <LayoutDashboard size={18} /> 
              <span className="hidden sm:inline">Metraj Girişi</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'summary' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              <ClipboardList size={18} /> 
              <span className="hidden sm:inline">Hakediş Özeti</span>
            </button>

            <button
              onClick={() => setActiveTab('cover')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'cover' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              <BookOpenCheck size={18} /> 
              <span className="hidden sm:inline">Arka Kapak</span>
            </button>
            
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'report' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              <Printer size={18} /> 
              <span className="hidden sm:inline">Raporla</span>
            </button>
          </nav>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
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
            />
          )}

          {activeTab === 'cover' && (
            <PaymentCover 
              sheets={sheets} 
              previousQuantities={previousQuantities} 
            />
          )}

          {activeTab === 'report' && (
            <div className="flex flex-col items-center">
              {/* Yazdırma Bilgi Barı */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 max-w-4xl no-print w-full flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                  <div>
                    <p className="text-sm text-blue-900 font-bold">Rapor Önizleme Modu</p>
                    <p className="text-xs text-blue-700">
                      Çıktı almak için <span className="font-mono bg-blue-100 px-1 rounded">CTRL+P</span> kısayolunu kullanabilir veya butona tıklayabilirsiniz.
                    </p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 transition"
                  >
                    <Printer size={18} /> Yazdır
                  </button>
              </div>

              {/* Rapor Bileşeni */}
              <PrintReport 
                 sheets={sheets} 
                 projectInfo={projectInfo}
                 previousQuantities={previousQuantities}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;