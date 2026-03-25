import React, { useMemo } from 'react';
import { MeasurementSheet, ProjectInfo, CoverData } from '../types';
import { calculateMeasurementRow, formatNumber, formatCurrency } from '../utils';
import { Download, Printer } from 'lucide-react';

interface Props {
  sheets: MeasurementSheet[];
  projectInfo: ProjectInfo;
  previousQuantities: Record<string, number>;
  coverData: CoverData;
}

export const PrintReport: React.FC<Props> = ({ sheets, projectInfo, previousQuantities, coverData }) => {

  // --- HESAPLAMALAR ---
  const workDone = useMemo(() => {
    let totalGeneral = 0;
    let totalPrev = 0;
    sheets.forEach(sheet => {
      totalGeneral += sheet.totalAmount * sheet.unitPrice;
      const prevQty = previousQuantities[sheet.id] || 0;
      totalPrev += prevQty * sheet.unitPrice;
    });
    return { general: totalGeneral, prev: totalPrev, current: totalGeneral - totalPrev };
  }, [sheets, previousQuantities]);

  const extraTotals = useMemo(() => {
    let prev = 0, current = 0;
    coverData.extraPayments.forEach(item => {
      prev += item.prevAmount || 0;
      current += item.currentAmount || 0;
    });
    return { prev, current, general: prev + current };
  }, [coverData.extraPayments]);

  const deductionTotals = useMemo(() => {
    let prev = 0, current = 0;
    coverData.deductions.forEach(item => {
      prev += item.prevAmount || 0;
      current += item.currentAmount || 0;
    });
    return { prev, current, general: prev + current };
  }, [coverData.deductions]);

  const totalAmountA = {
    prev: workDone.prev + extraTotals.prev,
    current: workDone.current + extraTotals.current,
    general: workDone.general + extraTotals.general
  };

  const kdvAmount = {
    prev: totalAmountA.prev * (coverData.kdvRate / 100),
    current: totalAmountA.current * (coverData.kdvRate / 100),
    general: totalAmountA.general * (coverData.kdvRate / 100)
  };

  const invoiceAmount = {
    prev: totalAmountA.prev + kdvAmount.prev,
    current: totalAmountA.current + kdvAmount.current,
    general: totalAmountA.general + kdvAmount.general
  };

  const netPayable = {
    prev: invoiceAmount.prev - deductionTotals.prev,
    current: invoiceAmount.current - deductionTotals.current,
    general: invoiceAmount.general - deductionTotals.general
  };

  const detailedGroupedData = useMemo(() => {
    const groups: Record<string, any> = {};

    sheets.forEach(sheet => {
      const groupKey = `${sheet.code}_${sheet.groupName}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          code: sheet.code,
          description: sheet.groupName,
          unit: sheet.unit,
          unitPrice: sheet.unitPrice,
          totalQty: 0,
          prevQty: 0
        };
      }
      groups[groupKey].totalQty += sheet.totalAmount;
      groups[groupKey].prevQty += (previousQuantities[sheet.id] || 0);
    });

    return Object.values(groups).map((item: any) => {
      const currentQty = item.totalQty - item.prevQty;
      return {
        ...item, currentQty,
        prevAmount: item.prevQty * item.unitPrice,
        currentAmount: currentQty * item.unitPrice,
        totalAmount: item.totalQty * item.unitPrice
      };
    });
  }, [sheets, previousQuantities]);

  const grandTotalAmount = detailedGroupedData.reduce((acc, item) => acc + item.totalAmount, 0);
  const totalPrevAmount = detailedGroupedData.reduce((acc, item) => acc + item.prevAmount, 0);
  const totalCurrentAmount = detailedGroupedData.reduce((acc, item) => acc + item.currentAmount, 0);
  const totalPages = 4 + sheets.length;

  // YENİ EKLENEN NAKDİ GERÇEKLEŞME (FİZİKİ İLERLEME) HESABI
  // Yapılan İşler Tutarı (Matrah) / Sözleşme Bedeli
  const completionPercentage = projectInfo.contractAmount && projectInfo.contractAmount > 0
    ? ((totalAmountA.general / projectInfo.contractAmount) * 100)
    : 0;

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 15;
      });
    }, 500);

    try {
      const reportElement = document.getElementById('report-container');
      if (!reportElement) throw new Error("Rapor alanı bulunamadı.");

      const fullHtml = `
        <!DOCTYPE html>
        <html lang="tr">
          <head>
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { background-color: white !important; font-family: Arial, Helvetica, sans-serif !important; }
              .no-print { display: none !important; }
              .report-page { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                padding: 10mm !important;
                page-break-after: always;
              }
              .num { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
            </style>
          </head>
          <body class="antialiased text-black text-[11px]">
            ${reportElement.outerHTML}
          </body>
        </html>
      `;

      const response = await fetch('/api/oracle-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: fullHtml })
      });

      if (!response.ok) throw new Error('Sunucu PDF oluştururken hata verdi.');

      clearInterval(progressInterval);
      setProgress(100);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectInfo.projectName.replace(/\s+/g, '_')}_Hakedis.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      alert("PDF üretilirken sunucu hatası oluştu.");
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 1000);
    }
  };

  // Üst Bilgi (Kurumsal Antet Stili) - DÜZELTİLMİŞ VERSİYON
  const Header = ({ title }: { title: string }) => (
    <div className="border-b-[2px] border-black pb-3 mb-5 avoid-break mt-2">
      {/* table-fixed eklendi, böylece %'lik genişlikler kesin olarak korunur */}
      <table className="w-full text-[10px] leading-snug border-none !p-0 !m-0 table-fixed">
        <tbody>
          <tr className="border-none !p-0">
            {/* Sağdan boşluk (pr-2) ve break-words eklendi */}
            <td className="w-[35%] text-left align-bottom border-none !p-0 pr-2">
              <p className="text-gray-600 uppercase text-[9px] mb-0.5 tracking-wider">İdare / İşveren Kurum</p>
              <p className="uppercase text-black font-bold text-[11px] mb-2 break-words">{projectInfo.employer || 'Belirtilmedi'}</p>
              <p className="text-gray-600 uppercase text-[9px] mb-0.5 tracking-wider">İşin (Proje) Adı</p>
              <p className="uppercase text-black font-bold text-[11px] break-words">{projectInfo.projectName}</p>
            </td>
            {/* Ortaya sağdan-soldan boşluk (px-2) eklendi, whitespace-nowrap kaldırıldı */}
            <td className="w-[30%] text-center align-bottom border-none !p-0 px-2 pb-1">
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-black break-words">{title}</h2>
            </td>
            {/* Soldan boşluk (pl-2) ve break-words eklendi */}
            <td className="w-[35%] text-right align-bottom border-none !p-0 pl-2">
              <p className="text-gray-600 uppercase text-[9px] mb-0.5 tracking-wider">Yüklenici Firma</p>
              <p className="uppercase text-black font-bold text-[11px] mb-2 break-words">{projectInfo.contractor}</p>
              <p className="text-gray-600 uppercase text-[9px] mb-0.5 tracking-wider">Dönem / Tarih</p>
              <p className="uppercase text-black font-bold text-[11px] break-words">{projectInfo.period} - {new Date(projectInfo.date).toLocaleDateString('tr-TR')}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // İmza Alanı (Resmi evrak düzeni - Maksimum 4'lü Gruplama ve Garantili Boşluk)
  const SignatureBlock = () => {
    const sigs = projectInfo.signatories || [];
    const chunkSize = 4; // Bir satırda maksimum kaç imza olacağı
    const chunks = [];

    // İmzaları 4'erli gruplara (satırlara) bölüyoruz
    for (let i = 0; i < sigs.length; i += chunkSize) {
      chunks.push(sigs.slice(i, i + chunkSize));
    }

    return (
      <div className="mt-12 w-full avoid-break print:mt-8">
        {chunks.map((chunk, chunkIndex) => (
          <table key={chunkIndex} className={`w-full text-center border-none !p-0 !m-0 table-fixed ${chunkIndex > 0 ? 'mt-20' : ''}`}>
            <tbody>
              {/* 1. SATIR: Sadece Unvanlar */}
              <tr className="border-none !p-0">
                {chunk.map((sig, index) => (
                  <td key={index} className="align-bottom border-none !p-0 px-2">
                    {/* KRİTİK DÜZELTME: Yazıya mb-12 (Margin Bottom) ekledik. Bu sayede PDF motoru çizgiyi 48px aşağı itmek ZORUNDA kalacak. */}
                    <p className="font-bold uppercase text-[10px] text-black tracking-wider break-words mb-12">{sig.title}</p>
                  </td>
                ))}
              </tr>
              {/* 2. SATIR: İmza Çizgileri ve İsimler */}
              <tr className="border-none !p-0">
                {chunk.map((sig, index) => (
                  <td key={index} className="align-top border-none !p-0 px-2">
                    <div className="w-4/5 max-w-[150px] mx-auto border-t-[1.5px] border-black pt-2 min-h-[30px]">
                      <p className="text-[10px] text-black font-bold uppercase break-words">{sig.name || ''}</p>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        ))}
      </div>
    );
  };

  const PageNumber = ({ current }: { current: number }) => (
    <div className="absolute bottom-8 right-8 text-right text-[9px] text-gray-500 font-sans tracking-widest print:bottom-6 print:right-6">
      SAYFA {current} / {totalPages}
    </div>
  );

  return (
    <div className="w-full font-sans text-black relative flex flex-col items-center">

      <div className="bg-white border border-gray-200 p-4 mb-8 max-w-4xl w-full flex justify-between items-center rounded-lg shadow-sm no-print">
        <p className="text-xs text-gray-600 font-medium">Önizleme modu. Raporu resmi formatta dışa aktarabilirsiniz.</p>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="bg-emerald-600 text-white px-5 py-2 rounded-md text-[13px] font-bold hover:bg-emerald-700 flex items-center gap-2 transition disabled:opacity-100 relative overflow-hidden min-w-[190px] justify-center shadow-sm"
          >
            {isGenerating ? (
              <>
                <span className="relative z-10 flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  İşleniyor %{progress}
                </span>
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-800 transition-all duration-300 z-0"
                  style={{ width: `${progress}%` }}
                ></div>
              </>
            ) : (
              <>
                <Download size={16} /> PDF Rapor İndir
              </>
            )}
          </button>
          <button onClick={() => window.print()} className="bg-black text-white px-5 py-2 rounded-md text-[13px] font-bold hover:bg-gray-800 flex items-center gap-2 transition shadow-sm">
            <Printer size={16} /> Tarayıcıyla Yazdır
          </button>
        </div>
      </div>

      <div id="report-container" className="w-full bg-gray-50 print:bg-white flex flex-col items-center">

        {/* --- SAYFA 1: YENİ KURUMSAL ÖN KAPAK (SÖZLEŞME KÜNYESİ) --- */}
        <div className="report-page block relative bg-white p-10 md:p-12 print:pt-16">
          <div className="border-[3px] border-double border-black p-8 md:p-10 w-full max-w-3xl mx-auto bg-white flex flex-col min-h-[900px] print:min-h-0 print:h-full justify-between">

            <div className="text-center mb-10">
              <h1 className="text-[28px] md:text-[34px] font-black tracking-[0.15em] text-black border-b-[2px] border-black pb-6 leading-tight uppercase">
                HAKEDİŞ RAPORU VE<br />EKLERİ DOSYASI
              </h1>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {/* SÖZLEŞME KÜNYESİ TABLOSU */}
              <table className="w-full border-collapse border border-black text-[13px] text-left text-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">İdare / İşveren Kurum</td>
                    <td className="border border-black p-3.5 font-bold uppercase text-[14px]">{projectInfo.employer || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">Yüklenici Firma</td>
                    <td className="border border-black p-3.5 font-bold uppercase text-[14px]">{projectInfo.contractor || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">İşin Adı</td>
                    <td className="border border-black p-3.5 font-bold uppercase text-[14px]">{projectInfo.projectName || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">İhale Kayıt No (İKN)</td>
                    <td className="border border-black p-3.5 font-mono font-semibold text-[13px]">{projectInfo.ikn || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">Sözleşme Tarihi</td>
                    <td className="border border-black p-3.5 font-mono font-semibold text-[13px]">
                      {projectInfo.contractDate ? new Date(projectInfo.contractDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">Yer Teslim Tarihi</td>
                    <td className="border border-black p-3.5 font-mono font-semibold text-[13px]">
                      {projectInfo.siteDeliveryDate ? new Date(projectInfo.siteDeliveryDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">İşin Süresi</td>
                    <td className="border border-black p-3.5 uppercase font-semibold text-[13px]">{projectInfo.duration || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-100 uppercase text-[11px] tracking-wider">Sözleşme Bedeli</td>
                    <td className="border border-black p-3.5 font-bold num text-[14px]">
                      {projectInfo.contractAmount ? formatCurrency(projectInfo.contractAmount) : '-'}
                    </td>
                  </tr>
                  <tr className="border-t-[3px] border-black">
                    <td className="border border-black p-3.5 font-bold w-[35%] bg-gray-200 uppercase text-[11px] tracking-wider">Nakdi Gerçekleşme Oranı</td>
                    <td className="border border-black p-3.5 font-black text-black num text-[15px]">
                      {projectInfo.contractAmount ? `% ${formatNumber(completionPercentage, 2)}` : <span className="text-[10px] text-gray-500 font-sans">Sözleşme bedeli girilmedi</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex justify-between items-end border-t-[2px] border-black pt-8">
              <div>
                <p className="text-[11px] text-gray-600 font-bold mb-1 tracking-widest uppercase">HAKEDİŞ NO / DÖNEMİ</p>
                <p className="text-[22px] font-black text-black">{projectInfo.period}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-600 font-bold mb-1 tracking-widest uppercase">TANZİM TARİHİ</p>
                <p className="text-[22px] font-bold text-black">{new Date(projectInfo.date).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
          <PageNumber current={1} />
        </div>

        {/* --- DİĞER SAYFALAR AYNI ŞEKİLDE DEVAM EDİYOR --- */}

        {/* SAYFA 2: ARKA KAPAK */}
        <div className="report-page block relative bg-white">
          <Header title="HAKEDİŞ ARKA KAPAĞI" />

          <table className="w-full border-collapse border border-black text-[11px] mt-2 bg-white">
            <thead>
              <tr className="bg-gray-100 text-black border-b-[2px] border-black">
                <th className="border border-black p-3 text-left w-1/2 tracking-wider">AÇIKLAMA</th>
                <th className="border border-black p-3 text-right w-1/6 tracking-wider">KÜMÜLATİF</th>
                <th className="border border-black p-3 text-right w-1/6 tracking-wider">ÖNCEKİ</th>
                <th className="border border-black p-3 text-right w-1/6 tracking-wider">BU HAKEDİŞ</th>
              </tr>
            </thead>
            <tbody>
              {/* A) ÖDEMELER */}
              <tr className="bg-gray-50 border-b border-black">
                <td colSpan={4} className="border border-black p-2 text-center font-bold tracking-widest text-[10px] text-black">A) ÖDEMELER</td>
              </tr>
              <tr>
                <td className="border border-black p-2.5 font-bold text-black pl-5">1. Yapılan İşler Tutarı</td>
                <td className="border border-black p-2.5 text-right num">{formatNumber(workDone.general)}</td>
                <td className="border border-black p-2.5 text-right num">{formatNumber(workDone.prev)}</td>
                <td className="border border-black p-2.5 text-right font-bold text-black num">{formatNumber(workDone.current)}</td>
              </tr>
              {coverData.extraPayments.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-2.5 pl-5"><span className="mr-1">{idx + 2}.</span> {row.description}</td>
                  <td className="border border-black p-2.5 text-right num">{formatNumber((row.prevAmount || 0) + (row.currentAmount || 0))}</td>
                  <td className="border border-black p-2.5 text-right num">{formatNumber(row.prevAmount)}</td>
                  <td className="border border-black p-2.5 text-right font-bold num">{formatNumber(row.currentAmount)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold border-t-[2px] border-black">
                <td className="border border-black p-3 text-right uppercase">TOPLAM (Matrah) :</td>
                <td className="border border-black p-3 text-right num">{formatNumber(totalAmountA.general)}</td>
                <td className="border border-black p-3 text-right num">{formatNumber(totalAmountA.prev)}</td>
                <td className="border border-black p-3 text-right num">{formatNumber(totalAmountA.current)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2.5 text-right uppercase">KDV (%{coverData.kdvRate}) :</td>
                <td className="border border-black p-2.5 text-right num">{formatNumber(kdvAmount.general)}</td>
                <td className="border border-black p-2.5 text-right num">{formatNumber(kdvAmount.prev)}</td>
                <td className="border border-black p-2.5 text-right num font-bold">{formatNumber(kdvAmount.current)}</td>
              </tr>
              <tr className="bg-gray-100 font-bold border-t border-black">
                <td className="border border-black p-3 text-right uppercase">HAKEDİŞ FATURA TUTARI :</td>
                <td className="border border-black p-3 text-right num">{formatNumber(invoiceAmount.general)}</td>
                <td className="border border-black p-3 text-right num">{formatNumber(invoiceAmount.prev)}</td>
                <td className="border border-black p-3 text-right text-black num text-[12px]">{formatNumber(invoiceAmount.current)}</td>
              </tr>

              {/* B) KESİNTİLER */}
              <tr className="bg-gray-50 border-b border-black border-t-[2px]">
                <td colSpan={4} className="border border-black p-2 text-center font-bold tracking-widest text-[10px] text-black">B) KESİNTİLER</td>
              </tr>
              {coverData.deductions.length === 0 && (
                <tr><td colSpan={4} className="border border-black p-4 text-center text-gray-500 italic">Kesinti bulunmamaktadır.</td></tr>
              )}
              {coverData.deductions.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-2.5 pl-5"><span className="mr-1">{idx + 1}.</span> {row.description}</td>
                  <td className="border border-black p-2.5 text-right num">{formatNumber((row.prevAmount || 0) + (row.currentAmount || 0))}</td>
                  <td className="border border-black p-2.5 text-right num">{formatNumber(row.prevAmount)}</td>
                  <td className="border border-black p-2.5 text-right font-bold num">{formatNumber(row.currentAmount)}</td>
                </tr>
              ))}

              {/* NET ÖDENECEK */}
              <tr className="bg-gray-100 font-bold border-t-[3px] border-black">
                <td className="border border-black p-5 text-right tracking-widest text-[12px] uppercase">Net Ödenecek Tutar :</td>
                <td colSpan={3} className="border border-black p-5 text-right num text-[14px] text-black">
                  {formatCurrency(netPayable.current)}
                </td>
              </tr>
            </tbody>
          </table>
          <SignatureBlock />
          <PageNumber current={2} />
        </div>

        {/* SAYFA 3: İCMAL */}
        <div className="report-page block relative bg-white">
          <Header title="HAKEDİŞ İCMALİ (ÖZETİ)" />

          <table className="w-full border-collapse border border-black text-[10px] bg-white">
            <thead>
              <tr className="bg-gray-100 font-bold text-center border-b-[2px] border-black">
                <th rowSpan={2} className="border border-black p-2 w-16">Poz No</th>
                <th rowSpan={2} className="border border-black p-2">İşin Cinsi / Tanımı</th>
                <th rowSpan={2} className="border border-black p-2 w-10">Birim</th>
                <th rowSpan={2} className="border border-black p-2 w-16">Birim Fiyat</th>
                <th colSpan={3} className="border border-black p-2 border-b-[1.5px] border-black">Yapılan İş Miktarı</th>
                <th colSpan={3} className="border border-black p-2 border-b-[1.5px] border-black">Yapılan İş Tutarı (TL)</th>
              </tr>
              <tr className="bg-gray-50 font-bold text-center text-[9px] text-black">
                <th className="border border-black p-1.5 w-14 uppercase">Önceki</th>
                <th className="border border-black p-1.5 w-14 uppercase">Bu Dönem</th>
                <th className="border border-black p-1.5 w-14 uppercase">Toplam</th>
                <th className="border border-black p-1.5 w-16 uppercase">Önceki</th>
                <th className="border border-black p-1.5 w-16 uppercase">Bu Dönem</th>
                <th className="border border-black p-1.5 w-16 uppercase">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {detailedGroupedData.map((item: any) => (
                <tr key={item.code} className="hover:bg-gray-50">
                  <td className="border border-black p-2 text-center font-bold">{item.code}</td>
                  <td className="border border-black p-2">{item.description}</td>
                  <td className="border border-black p-2 text-center">{item.unit}</td>
                  <td className="border border-black p-2 text-right num">{formatNumber(item.unitPrice, 2)}</td>

                  <td className="border border-black p-2 text-right num">{formatNumber(item.prevQty, 3)}</td>
                  <td className="border border-black p-2 text-right font-bold text-black num">{formatNumber(item.currentQty, 3)}</td>
                  <td className="border border-black p-2 text-right font-semibold num">{formatNumber(item.totalQty, 3)}</td>

                  <td className="border border-black p-2 text-right num">{formatNumber(item.prevAmount, 2)}</td>
                  <td className="border border-black p-2 text-right font-bold text-black num">{formatNumber(item.currentAmount, 2)}</td>
                  <td className="border border-black p-2 text-right font-semibold num">{formatNumber(item.totalAmount, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold border-t-[2px] border-black">
                <td colSpan={7} className="border border-black p-3 text-right uppercase tracking-wider text-[11px]">Genel Toplam:</td>
                <td className="border border-black p-3 text-right text-[11px] num">{formatNumber(totalPrevAmount)}</td>
                <td className="border border-black p-3 text-right text-[11px] text-black num">{formatNumber(totalCurrentAmount)}</td>
                <td className="border border-black p-3 text-right text-[11px] num">{formatNumber(grandTotalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <SignatureBlock />
          <PageNumber current={3} />
        </div>

        {/* SAYFA 4: YEŞİL DEFTER */}
        <div className="report-page block relative bg-white">
          <Header title="YEŞİL DEFTER (METRAJ İCMALİ)" />

          <table className="w-full border-collapse border border-black text-[11px] bg-white mt-2">
            <thead>
              <tr className="bg-gray-100 font-bold text-center text-black border-b-[2px] border-black">
                <th className="border border-black p-2.5 w-20">Poz No</th>
                <th className="border border-black p-2.5 text-left">Açıklama / İmalat Yeri</th>
                <th className="border border-black p-2.5 w-12">Birim</th>
                <th className="border border-black p-2.5 w-24 text-right">Kümülatif</th>
                <th className="border border-black p-2.5 w-24 text-right">Önceki Metraj</th>
                <th className="border border-black p-2.5 w-24 text-right text-black">Bu Hakediş</th>
              </tr>
            </thead>
            <tbody>
              {sheets.length > 0 ? sheets.map((sheet) => {
                const prevQty = previousQuantities[sheet.id] || 0;
                const currentQty = sheet.totalAmount - prevQty;
                return (
                  <tr key={sheet.id} className="hover:bg-gray-50">
                    <td className="border border-black p-2.5 text-center font-bold">{sheet.code}</td>
                    <td className="border border-black p-2.5">
                      <span className="font-bold">{sheet.groupName}</span>
                      <span className="text-gray-600 ml-1">({sheet.description})</span>
                    </td>
                    <td className="border border-black p-2.5 text-center">{sheet.unit}</td>
                    <td className="border border-black p-2.5 text-right num">{formatNumber(sheet.totalAmount, 3)}</td>
                    <td className="border border-black p-2.5 text-right num">{formatNumber(prevQty, 3)}</td>
                    <td className="border border-black p-2.5 text-right font-bold text-black num">{formatNumber(currentQty, 3)}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="border border-black p-4 text-center text-gray-500 italic">Veri bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
          <SignatureBlock />
          <PageNumber current={4} />
        </div>

        {/* SAYFA 5+: METRAJ CETVELLERİ */}
        {sheets.map((sheet, index) => (
          <div key={sheet.id} className="report-page block relative bg-white">
            <Header title="METRAJ CETVELİ" />

            <div className="bg-gray-100 p-3 border border-black border-b-0 font-bold text-[11px] flex justify-between uppercase mt-2">
              <span className="text-black">{index + 1}. {sheet.groupName} <span className="text-gray-700 font-normal capitalize ml-1">({sheet.description})</span></span>
              <span className="tracking-widest">POZ: {sheet.code}</span>
            </div>

            <table className="w-full border-collapse border border-black text-[11px] bg-white">
              <thead>
                <tr className="bg-gray-50 text-black border-b-[2px] border-black font-bold">
                  <th className="border border-black p-2.5 text-left">Açıklama / İmalat Yeri</th>
                  {sheet.type === 'rebar' ? (
                    <>
                      <th className="border border-black p-2.5 text-center w-16">Çap (Ø)</th>
                      <th className="border border-black p-2.5 text-center w-16">Boy (L)</th>
                      <th className="border border-black p-2.5 text-center w-16">B.Ağır.</th>
                    </>
                  ) : (
                    <>
                      <th className="border border-black p-2.5 text-center w-16">En</th>
                      <th className="border border-black p-2.5 text-center w-16">Boy</th>
                      <th className="border border-black p-2.5 text-center w-16">Yükseklik</th>
                    </>
                  )}
                  <th className="border border-black p-2.5 text-center w-14">Adet</th>
                  <th className="border border-black p-2.5 text-right w-28">Miktar</th>
                </tr>
              </thead>
              <tbody>
                {sheet.measurements.length > 0 ? sheet.measurements.map((m) => (
                  <tr key={m.id}>
                    <td className="border border-black p-2">{m.description || '-'}</td>

                    {sheet.type === 'rebar' ? (
                      <>
                        <td className="border border-black p-2 text-center num">{m.diameter ? formatNumber(m.diameter) : '-'}</td>
                        <td className="border border-black p-2 text-center num">{m.length ? formatNumber(m.length) : '-'}</td>
                        <td className="border border-black p-2 text-center num">{m.unitWeight ? formatNumber(m.unitWeight) : (m.diameter ? 'Oto.' : '-')}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-black p-2 text-center num">{m.width ? formatNumber(m.width) : '-'}</td>
                        <td className="border border-black p-2 text-center num">{m.length ? formatNumber(m.length) : '-'}</td>
                        <td className="border border-black p-2 text-center num">{m.height ? formatNumber(m.height) : '-'}</td>
                      </>
                    )}

                    <td className="border border-black p-2 text-center font-bold num">{formatNumber(m.count)}</td>
                    <td className="border border-black p-2 text-right font-bold num">{formatNumber(calculateMeasurementRow(m, sheet.type), 2)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500 italic">Veri girilmemiş.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-[2px] border-black">
                  <td colSpan={5} className="border border-black p-3 text-right tracking-wider uppercase">Toplam Metraj:</td>
                  <td className="border border-black p-3 text-right text-[12px] text-black num">{formatNumber(sheet.totalAmount, 2)} {sheet.unit}</td>
                </tr>
              </tfoot>
            </table>

            <SignatureBlock />
            <PageNumber current={5 + index} />
          </div>
        ))}
      </div>
    </div>
  );
};