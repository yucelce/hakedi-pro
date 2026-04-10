import React, { useState } from 'react';
import { MeasurementSheet, ProjectInfo } from '../types';
import { formatNumber } from '../utils';
import { BookOpen, Printer, Info, CloudDownload, X, Loader2, Clock, ArrowRightLeft, CheckCircle2, Settings, FileSpreadsheet } from 'lucide-react';
import { supabase } from './supabase';


interface Props {
  sheets: MeasurementSheet[];
  projectInfo: ProjectInfo;
  previousQuantities: Record<string, number>;
  setPreviousQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  accountId?: string | null;
  coverData: CoverData; 
}

export const GreenBook: React.FC<Props> = ({ sheets, projectInfo, previousQuantities, setPreviousQuantities, accountId,coverData }) => {
  // --- STATE'LER ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Eşleştirme Sihirbazı State'leri
  const [isMatchingStep, setIsMatchingStep] = useState(false); // 1. Aşama mı, 2. Aşama mı?
  const [isImporting, setIsImporting] = useState(false);
  const [selectedOldProjectName, setSelectedOldProjectName] = useState('');
  const [oldProjectSheets, setOldProjectSheets] = useState<MeasurementSheet[]>([]);
  
  // Eşleşme Haritası: { "mevcut_sheet_id": "eski_sheet_id" }
  const [matchMap, setMatchMap] = useState<Record<string, string>>({});

  // --- MANUEL DEĞİŞTİRME ---
  const handlePrevChange = (code: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPreviousQuantities(prev => ({
      ...prev,
      [code]: numValue
    }));
  };

  // --- 1. AŞAMA: PROJELERİ LİSTELE ---
  const openImportModal = async () => {
    if (!accountId) {
      alert("Oturum bilginiz bulunamadı.");
      return;
    }
    
    setIsModalOpen(true);
    setIsMatchingStep(false);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hakedis_projects')
        .select('id, project_name, period, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error(error);
      alert("Projeler yüklenirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. AŞAMA: PROJE SEÇİLDİĞİNDE EŞLEŞTİRME EKRANINI HAZIRLA ---
  const handleSelectProjectToMatch = async (projectId: string, projectName: string) => {
    setIsImporting(true);
    setSelectedOldProjectName(projectName);
    
    try {
      const { data, error } = await supabase
        .from('hakedis_projects')
        .select('project_data')
        .eq('id', projectId)
        .single();

      if (error || !data) throw error;

      const oldSheets: MeasurementSheet[] = data.project_data.sheets || [];
      setOldProjectSheets(oldSheets);

      // --- GELİŞMİŞ AKILLI EŞLEŞTİRME ALGORİTMASI ---
      const initialMatchMap: Record<string, string> = {};
      
      // Metinleri karşılaştırmak için standartlaştırıcı yardımcı fonksiyon (Büyük/küçük harf ve boşluk duyarsız)
      const normalize = (str: string) => (str || '').trim().toLocaleLowerCase('tr-TR');

      sheets.forEach(currentSheet => {
        const currCode = normalize(currentSheet.code);
        const currName = normalize(currentSheet.groupName);

        // 1. KUSURSUZ EŞLEŞME (Hem Poz No hem Cetvel Adı eşleşiyorsa)
        let match = oldSheets.find(old => 
          normalize(old.code) === currCode && normalize(old.groupName) === currName
        );

        // 2. KISMİ EŞLEŞME - POZ NO (Kusursuz yoksa, sadece Poz No'ya bak)
        if (!match) {
          match = oldSheets.find(old => normalize(old.code) === currCode);
        }

        // 3. KISMİ EŞLEŞME - CETVEL ADI (Poz no da tutmadıysa, sadece isme bak)
        if (!match) {
          match = oldSheets.find(old => normalize(old.groupName) === currName);
        }

        // Sonucu haritaya yaz (Bulunduysa ID'sini, bulunamadıysa boş bırak)
        if (match) {
          initialMatchMap[currentSheet.id] = match.id;
        } else {
          initialMatchMap[currentSheet.id] = ''; // Eşleşme bulunamadı
        }
      });

      setMatchMap(initialMatchMap);
      setIsMatchingStep(true); // 2. Aşamaya geç
    } catch (error) {
      console.error(error);
      alert("Proje detayları çekilirken hata oluştu.");
    } finally {
      setIsImporting(false);
    }
  };

  // --- EŞLEŞME HARİTASINI GÜNCELLEME (Kullanıcı dropdown'dan değiştirirse) ---
  const updateMatch = (currentSheetId: string, oldSheetId: string) => {
    setMatchMap(prev => ({ ...prev, [currentSheetId]: oldSheetId }));
  };

  // --- 3. AŞAMA: ONAY VE AKTARIM ---
  const handleFinalizeImport = () => {
    const newPrevQuantities = { ...previousQuantities };

    sheets.forEach(currentSheet => {
      const matchedOldSheetId = matchMap[currentSheet.id];
      if (matchedOldSheetId) {
        // Eğer bir eşleşme seçildiyse o değeri al
        const oldSheetData = oldProjectSheets.find(s => s.id === matchedOldSheetId);
        if (oldSheetData) {
          // Önceki miktarları Poz Kodu (sheet.code) bazında kaydediyoruz
          newPrevQuantities[currentSheet.id] = oldSheetData.totalAmount;
        }
      } else {
        // Eşleşme yok ("Geç" seçildiyse) 0 bırak
        newPrevQuantities[currentSheet.id] = 0;
      }
    });

    setPreviousQuantities(newPrevQuantities);
    setIsModalOpen(false);
    setIsMatchingStep(false);
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-xl border border-slate-200 shadow-sm min-h-full font-sans">
      
      {/* --- ANA EKRAN ÜST BAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 no-print gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><BookOpen size={20} /></div>
            Yeşil Defter (Metraj İcmali)
          </h2>
          <p className="text-slate-500 text-xs mt-2 max-w-2xl flex items-center gap-1.5">
            <Info size={14} className="text-emerald-500 shrink-0" />
            Pozların kümülatif metraj özetleridir. "Önceki Dönem" metrajlarını manuel girebilir veya eski bir projeden akıllı eşleştirme ile çekebilirsiniz.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
  <button onClick={() => setShowSettings(!showSettings)} className="...">
    <Settings size={16} /> Ayarlar
  </button>
  

  <button onClick={() => window.print()} className="...">
    <Printer size={16} /> Yazdır
  </button>
</div>
      </div>

      {/* --- ANA TABLO (YEŞİL DEFTER) --- */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm print:border-none print:shadow-none">
        <table className="w-full text-sm text-left border-collapse whitespace-nowrap print:text-xs">
          <thead>
            <tr className="bg-slate-50 text-center text-[10px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 print:bg-slate-100 print:text-black">
              <th className="border-r border-slate-200 p-3 w-24">Poz No</th>
              <th className="border-r border-slate-200 p-3 text-left min-w-[300px]">Açıklama / İmalat Yeri</th>
              <th className="border-r border-slate-200 p-3 w-20">Birim</th>
              <th className="border-r border-slate-200 p-3 w-32 text-right bg-blue-50/50 text-blue-800 print:bg-transparent print:text-black">Kümülatif</th>
              <th className="border-r border-slate-200 p-3 w-32 text-right bg-amber-50/50 text-amber-800 print:bg-transparent print:text-black">Önceki Metraj</th>
              <th className="p-3 w-32 text-right bg-emerald-50/50 text-emerald-800 print:bg-transparent print:text-black">Bu Hakediş</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {sheets.length > 0 ? (
              sheets.map((sheet) => {
                const prevQty = previousQuantities[sheet.id] || 0;
                const currentQty = sheet.totalAmount - prevQty;

                return (
                  <tr key={sheet.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors print:border-slate-300 group">
                    <td className="border-r border-slate-100 p-3 text-center font-mono font-bold text-slate-700 print:border-slate-300">{sheet.code}</td>
                    <td className="border-r border-slate-100 p-3 truncate max-w-[350px] print:border-slate-300 print:whitespace-normal">
                      <span className="font-bold text-slate-800">{sheet.groupName}</span>
                      <span className="text-slate-500 text-[10px] ml-2">({sheet.description})</span>
                    </td>
                    <td className="border-r border-slate-100 p-3 text-center text-slate-500 print:border-slate-300">{sheet.unit}</td>
                    
                    <td className="border-r border-slate-100 p-3 text-right font-mono font-bold text-blue-700 bg-blue-50/20 print:border-slate-300 print:bg-transparent print:text-black">
                      {formatNumber(sheet.totalAmount, 3)}
                    </td>

                    <td className="border-r border-slate-100 p-0 text-right font-mono bg-amber-50/30 focus-within:ring-2 focus-within:ring-amber-400 focus-within:bg-white transition-all print:border-slate-300 print:bg-transparent print:p-3 print:text-black">
                      <input 
                        type="number" 
                        value={prevQty === 0 ? '' : prevQty}
                        onChange={(e) => handlePrevChange(sheet.id, e.target.value)}
                        className="w-full h-full p-3 bg-transparent text-right font-mono outline-none text-amber-700 placeholder:text-amber-300 font-bold print:hidden"
                        placeholder="0"
                      />
                      <span className="hidden print:inline-block w-full text-right">{formatNumber(prevQty, 3)}</span>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30 print:bg-transparent print:text-black">
                      {formatNumber(currentQty, 3)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <BookOpen size={32} className="text-slate-200" />
                    <span className="text-sm">Yeşil defterde gösterilecek kayıt bulunamadı.</span>
                    <span className="text-xs">Önce Metraj Cetvelleri sekmesinden veri girmelisiniz.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL YÖNETİMİ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col border border-slate-200 overflow-hidden">
            
            {/* Modal Başlık */}
            <div className="bg-amber-50 px-5 py-4 border-b border-amber-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
                  <CloudDownload size={18} /> {isMatchingStep ? 'Kalem Eşleştirme Sihirbazı' : 'Önceki Hakedişi Seçin'}
                </h3>
                <p className="text-xs text-amber-700 mt-1">
                  {isMatchingStep ? `"${selectedOldProjectName}" projesindeki kalemler ile mevcut kalemlerinizi eşleştirin.` : 'Verilerini aktarmak istediğiniz kayıtlı projenizi seçin.'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setIsMatchingStep(false); }} className="text-amber-600 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 p-1.5 rounded-md transition">
                <X size={18} />
              </button>
            </div>

            {/* İçerik Gövdesi */}
            <div className="p-0 max-h-[60vh] overflow-y-auto bg-slate-50">
              
              {/* AŞAMA 1: PROJE LİSTESİ */}
              {!isMatchingStep && (
                isLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 size={32} className="animate-spin mb-2 text-amber-500" />
                    <p className="text-sm">Projeleriniz yükleniyor...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700 mb-1">Kayıtlı projeniz bulunamadı.</p>
                    <p className="text-xs">Veri aktarabilmek için hesabınızda kaydedilmiş bir proje olmalıdır.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {projects.map((proj) => (
                      <div key={proj.id} className="flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors bg-white">
                        <div>
                          <h4 className="font-bold text-slate-800">{proj.project_name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{proj.period}</span>
<span className="flex items-center gap-1"><Clock size={12} /> {new Date(proj.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectProjectToMatch(proj.id, proj.project_name)}
                          disabled={isImporting}
                          className="bg-amber-100 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300 px-4 py-2 rounded text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          {isImporting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />} Eşleştirmeye Başla
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* AŞAMA 2: KALEM EŞLEŞTİRME TABLOSU */}
              {isMatchingStep && (
                <div className="p-4 bg-white">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3 w-1/3 border-r border-slate-200">Mevcut İş Kalemi (Bu Proje)</th>
                          <th className="p-3 w-1/3 border-r border-slate-200 bg-amber-50 text-amber-800">Karşılık Gelen Kalem (Eski Proje)</th>
                          <th className="p-3 w-1/4 text-right">Aktarılacak Önceki Miktar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheets.map((currentSheet) => {
                          const matchedOldId = matchMap[currentSheet.id];
                          const oldSheetData = oldProjectSheets.find(s => s.id === matchedOldId);
                          
                          return (
                            <tr key={currentSheet.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              {/* MEVCUT KALEM */}
                              <td className="p-3 border-r border-slate-200">
                                <div className="font-mono text-[10px] text-slate-500">{currentSheet.code}</div>
                                <div className="font-bold text-slate-800">{currentSheet.groupName}</div>
                              </td>

                              {/* AÇILIR MENÜ (EŞLEŞTİRME SEÇİMİ) */}
                              <td className="p-2 border-r border-slate-200 bg-amber-50/20">
                                <select 
                                  value={matchedOldId || ''} 
                                  onChange={(e) => updateMatch(currentSheet.id, e.target.value)}
                                  className={`w-full p-2 border rounded outline-none text-xs shadow-sm ${!matchedOldId ? 'border-red-300 bg-red-50 text-red-700 font-bold' : 'border-slate-300 bg-white'}`}
                                >
                                  <option value="">-- EŞLEŞTİRME YOK (Sıfır Geçecek) --</option>
                                  {oldProjectSheets.map(old => (
                                    <option key={old.id} value={old.id}>
                                      [{old.code}] {old.groupName}
                                    </option>
                                  ))}
                                </select>
                                {!matchedOldId && <div className="text-[9px] text-red-500 mt-1">Sistem otomatik eşleşme bulamadı, listeden manuel seçiniz.</div>}
                              </td>

                              {/* AKTARILACAK DEĞER */}
                              <td className="p-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/20">
                                {oldSheetData ? formatNumber(oldSheetData.totalAmount, 3) : '0,000'} <span className="text-[9px] font-sans text-slate-500">{currentSheet.unit}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Eylemler) */}
            {isMatchingStep && (
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                <button onClick={() => setIsMatchingStep(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition font-medium">
                  Geri Dön (Proje Seçimi)
                </button>
                <button onClick={handleFinalizeImport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition">
                  <CheckCircle2 size={16} /> Aktarımı Tamamla
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};