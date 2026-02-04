import React, { useState } from 'react';
import { MeasurementSheet, TabView } from './types';
import { InputSection } from './components/InputSection';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentCover } from './components/PaymentCover'; // YENİ
import { generateId } from './utils';
import { 
  Printer, Calculator, LayoutDashboard, ClipboardList, BookOpenCheck 
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('input');
  const [previousQuantities, setPreviousQuantities] = useState<Record<string, number>>({});

  // Örnek Veri (Senaryo için biraz dolu veri)
  const [sheets, setSheets] = useState<MeasurementSheet[]>([
    {
      id: generateId(), groupName: 'A Blok Kaba Yapı', code: '15.120.100', description: 'C25/30 Hazır Beton',
      unit: 'm3', unitPrice: 2450.00, totalAmount: 100, calculatedCost: 245000,
      measurements: [{ id: generateId(), description: 'Zemin Kat', width: 10, length: 10, height: 1, count: 1, subtotal: 100 }]
    },
    {
      id: generateId(), groupName: 'A Blok İnce Yapı', code: 'Y.26.005/012', description: 'Saten Alçı Kaplaması',
      unit: 'm2', unitPrice: 150.00, totalAmount: 500, calculatedCost: 75000,
      measurements: [{ id: generateId(), description: 'Tüm Odalar', width: 0, length: 0, height: 0, count: 500, subtotal: 500 }]
    }
  ]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-100">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Calculator size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold">Hakediş Pro</h1>
          </div>
          
          <nav className="flex bg-slate-800 rounded-lg p-1 gap-1 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'input' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutDashboard size={18} /> Metraj Girişi
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <ClipboardList size={18} /> Hakediş Özeti
            </button>

            {/* YENİ BUTON */}
            <button
              onClick={() => setActiveTab('cover')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'cover' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpenCheck size={18} /> Arka Kapak
            </button>
            
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition text-sm font-medium whitespace-nowrap ${activeTab === 'report' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Printer size={18} /> Metraj Raporu
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'input' && <InputSection items={sheets} setItems={setSheets} />}
          
          {activeTab === 'summary' && (
            <PaymentSummary sheets={sheets} previousQuantities={previousQuantities} setPreviousQuantities={setPreviousQuantities} />
          )}

          {/* ARKA KAPAK */}
          {activeTab === 'cover' && (
            <PaymentCover sheets={sheets} previousQuantities={previousQuantities} />
          )}

          {activeTab === 'report' && <div className="bg-white p-12 text-center rounded-xl shadow">Rapor sayfası...</div>}
        </div>
      </main>

    </div>
  );
};

export default App;