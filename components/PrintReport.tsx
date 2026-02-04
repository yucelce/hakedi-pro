// components/PrintReport.tsx
import React, { useMemo } from 'react';
import { MeasurementSheet, ProjectInfo, CoverData } from '../types';
import { calculateMeasurementRow, formatNumber, formatCurrency } from '../utils';

interface Props {
  sheets: MeasurementSheet[];
  projectInfo: ProjectInfo;
  previousQuantities: Record<string, number>;
  coverData: CoverData;
}

export const PrintReport: React.FC<Props> = ({ sheets, projectInfo, previousQuantities, coverData }) => {

  // --- HESAPLAMALAR (Aynen kalıyor, kod tekrarı olmasın diye burayı kısalttım) ---
  // ... workDone, extraTotals, deductionTotals, totalAmountA, kdvAmount, invoiceAmount, netPayable hesaplamaları ...
  // ... groupedData, grandTotalAmount hesaplamaları ...
  // (Lütfen buradaki hesaplama mantığınızı koruyun)
  
  // --- HESAPLAMALARIN TEKRARI (Sizdeki mevcut kodun aynısı kalacak) ---
  const workDone = useMemo(() => {
    let totalGeneral = 0;
    let totalPrev = 0;
    sheets.forEach(sheet => {
      totalGeneral += sheet.totalAmount * sheet.unitPrice;
      const prevQty = previousQuantities[sheet.code] || 0;
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

    const groupedData = useMemo(() => {
        const groups: Record<string, any> = {};
        sheets.forEach(sheet => {
          if (!groups[sheet.code]) {
            groups[sheet.code] = {
              code: sheet.code,
              description: sheet.description || sheet.groupName,
              unit: sheet.unit,
              unitPrice: sheet.unitPrice,
              totalQty: 0
            };
          }
          groups[sheet.code].totalQty += sheet.totalAmount;
        });
        return Object.values(groups);
      }, [sheets]);
    
      const grandTotalAmount = groupedData.reduce((acc, item) => {
        const prevQty = previousQuantities[item.code] || 0;
        const currentQty = item.totalQty - prevQty;
        return acc + (currentQty * item.unitPrice);
      }, 0);


  // --- HEADER BİLEŞENİ ---
  const Header = ({ title }: { title: string }) => (
    <div className="border-b-2 border-gray-800 pb-2 mb-6">
      <div className="flex justify-between uppercase font-bold text-xs">
        <div>
          <h1 className="text-sm md:text-base">{projectInfo.projectName}</h1>
          <p className="text-gray-600 text-xs">{projectInfo.contractor}</p>
        </div>
        <div className="text-right">
          <h2>{projectInfo.period}</h2>
          <p className="text-xs">{new Date(projectInfo.date).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
      <div className="text-center mt-4">
        <span className="border-2 border-gray-800 px-6 py-2 font-bold text-base rounded bg-gray-50 uppercase tracking-widest">
          {title}
        </span>
      </div>
    </div>
  );

  const SignatureBlock = () => (
    <div className="grid grid-cols-3 gap-4 mt-auto pt-12 px-4 text-center break-inside-avoid">
      {(projectInfo.signatories || []).map((sig, index) => (
        <div key={index} className="flex flex-col items-center">
            <div className="w-full border-b border-black pb-1 mb-8 min-h-[20px] flex items-end justify-center">
               <p className="font-bold uppercase text-[10px]">{sig.title}</p>
            </div>
            <p className="text-[10px]">{sig.name}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-gray-100 print:bg-white pb-10 print:pb-0 font-serif text-black">
      
      {/* --------------------------------------------------------- */}
      {/* SAYFA 1: ÖN KAPAK */}
      {/* --------------------------------------------------------- */}
      <div className="report-page flex flex-col justify-center items-center text-center border-4 border-double border-gray-800">
          <div className="absolute top-12 right-12 text-right">
             <p className="text-sm font-bold">{new Date(projectInfo.date).toLocaleDateString('tr-TR')}</p>
          </div>
          
          <h1 className="text-5xl font-bold mb-24 tracking-widest border-b-4 border-gray-900 pb-4">HAKEDİŞ RAPORU</h1>

          <div className="w-full max-w-lg space-y-8 text-left">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">PROJE ADI</p>
                  <p className="text-xl font-bold border-b border-gray-400 pb-2">{projectInfo.projectName}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">YÜKLENİCİ FİRMA</p>
                  <p className="text-xl font-bold border-b border-gray-400 pb-2">{projectInfo.contractor}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">İŞVEREN (İDARE)</p>
                  <p className="text-xl font-bold border-b border-gray-400 pb-2">{projectInfo.employer}</p>
              </div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">HAKEDİŞ NO (DÖNEM)</p>
                  <p className="text-xl font-bold border-b border-gray-400 pb-2">{projectInfo.period}</p>
              </div>
          </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* SAYFA 2: ARKA KAPAK */}
      {/* --------------------------------------------------------- */}
      <div className="report-page flex flex-col">
        <Header title="HAKEDİŞ ARKA KAPAĞI" />
        
        <div className="border-2 border-black text-[11px] flex-grow-0">
             {/* Header Row */}
             <div className="grid grid-cols-12 bg-gray-200 font-bold border-b-2 border-black text-center">
                <div className="col-span-4 p-2 border-r border-black">AÇIKLAMA</div>
                <div className="col-span-2 p-2 border-r border-black">GENEL TOPLAM</div>
                <div className="col-span-3 p-2 border-r border-black">ÖNCEKİ HAKEDİŞ</div>
                <div className="col-span-3 p-2">BU HAKEDİŞ</div>
             </div>

             {/* A) ÖDEMELER */}
             <div className="p-2 font-bold bg-gray-100 border-b border-black">A) ÖDEMELER</div>

             {/* 1. Yapılan İşler */}
             <div className="grid grid-cols-12 border-b border-gray-300">
                <div className="col-span-4 p-2 border-r border-black font-semibold">1. Yapılan İşler Tutarı</div>
                <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(workDone.general)}</div>
                <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(workDone.prev)}</div>
                <div className="col-span-3 p-2 text-right font-bold">{formatNumber(workDone.current)}</div>
             </div>

             {/* Ek Ödemeler Loop */}
             {coverData.extraPayments.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 border-b border-gray-300">
                   <div className="col-span-4 p-1 pl-4 border-r border-black flex">
                      <span className="mr-1">{idx + 2}.</span> {row.description}
                   </div>
                   <div className="col-span-2 p-1 border-r border-black text-right text-gray-600">
                      {formatNumber((row.prevAmount||0) + (row.currentAmount||0))}
                   </div>
                   <div className="col-span-3 p-1 border-r border-black text-right text-gray-600">
                      {formatNumber(row.prevAmount)}
                   </div>
                   <div className="col-span-3 p-1 text-right font-bold">
                      {formatNumber(row.currentAmount)}
                   </div>
                </div>
             ))}

             {/* Toplam Matrah */}
             <div className="grid grid-cols-12 border-b border-black bg-gray-50 font-bold">
                <div className="col-span-4 p-2 border-r border-black text-right pr-2">TOPLAM (Matrah) :</div>
                <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(totalAmountA.general)}</div>
                <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(totalAmountA.prev)}</div>
                <div className="col-span-3 p-2 text-right">{formatNumber(totalAmountA.current)}</div>
             </div>

             {/* KDV */}
             <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-4 p-2 border-r border-black text-right pr-2">KDV (%{coverData.kdvRate}) :</div>
                <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(kdvAmount.general)}</div>
                <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(kdvAmount.prev)}</div>
                <div className="col-span-3 p-2 text-right">{formatNumber(kdvAmount.current)}</div>
             </div>

             {/* Fatura Tutarı */}
             <div className="grid grid-cols-12 border-b-2 border-black bg-blue-50 font-bold">
                <div className="col-span-4 p-2 border-r border-black text-right pr-2">HAKEDİŞ FATURA TUTARI :</div>
                <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(invoiceAmount.general)}</div>
                <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(invoiceAmount.prev)}</div>
                <div className="col-span-3 p-2 text-right">{formatNumber(invoiceAmount.current)}</div>
             </div>

             {/* B) KESİNTİLER */}
             <div className="p-2 font-bold bg-gray-100 border-b border-black">B) KESİNTİLER</div>
             
             {coverData.deductions.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 border-b border-gray-300">
                   <div className="col-span-4 p-1 pl-4 border-r border-black flex">
                      <span className="mr-1">{idx + 1}.</span> {row.description}
                   </div>
                   <div className="col-span-2 p-1 border-r border-black text-right text-gray-600">
                      {formatNumber((row.prevAmount||0) + (row.currentAmount||0))}
                   </div>
                   <div className="col-span-3 p-1 border-r border-black text-right text-gray-600">
                      {formatNumber(row.prevAmount)}
                   </div>
                   <div className="col-span-3 p-1 text-right font-bold">
                      {formatNumber(row.currentAmount)}
                   </div>
                </div>
             ))}

             {/* Kesintiler Toplamı */}
             <div className="grid grid-cols-12 border-b-2 border-black bg-red-50 font-bold">
                <div className="col-span-4 p-2 border-r border-black text-right pr-2">KESİNTİLER TOPLAMI :</div>
                <div className="col-span-2 p-2 border-r border-black text-right">{formatNumber(deductionTotals.general)}</div>
                <div className="col-span-3 p-2 border-r border-black text-right">{formatNumber(deductionTotals.prev)}</div>
                <div className="col-span-3 p-2 text-right">{formatNumber(deductionTotals.current)}</div>
             </div>

             {/* NET ÖDENECEK */}
             <div className="grid grid-cols-12 font-bold text-base bg-emerald-100">
                <div className="col-span-4 p-3 border-r border-black text-right pr-2">NET ÖDENECEK TUTAR :</div>
                <div className="col-span-8 p-3 text-right">
                   {formatNumber(netPayable.current)} TL
                </div>
             </div>
        </div>
        
        <SignatureBlock />
      </div>

      {/* --------------------------------------------------------- */}
      {/* SAYFA 3: İCMAL (YEŞİL DEFTER) */}
      {/* --------------------------------------------------------- */}
      <div className="report-page flex flex-col">
        <Header title="HAKEDİŞ ÖZETİ (İCMAL)" />
        
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-200 font-bold text-center border-b border-black">
              <th className="border-r border-black p-1">Poz No</th>
              <th className="border-r border-black p-1">İşin Tanımı</th>
              <th className="border-r border-black p-1">Birim</th>
              <th className="border-r border-black p-1">B.Fiyat</th>
              <th className="border-r border-black p-1 bg-yellow-50">Önceki</th>
              <th className="border-r border-black p-1 bg-blue-50">Bu Dönem</th>
              <th className="border-r border-black p-1">Toplam</th>
              <th className="p-1">Tutar (TL)</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((item) => {
              const prevQty = previousQuantities[item.code] || 0;
              const currentQty = item.totalQty - prevQty;
              const currentAmount = currentQty * item.unitPrice;

              return (
                <tr key={item.code} className="border-b border-gray-400">
                  <td className="border-r border-black p-1 text-center font-bold">{item.code}</td>
                  <td className="border-r border-black p-1">{item.description}</td>
                  <td className="border-r border-black p-1 text-center">{item.unit}</td>
                  <td className="border-r border-black p-1 text-right">{formatNumber(item.unitPrice)}</td>
                  <td className="border-r border-black p-1 text-right text-gray-500">{formatNumber(prevQty)}</td>
                  <td className="border-r border-black p-1 text-right font-bold">{formatNumber(currentQty)}</td>
                  <td className="border-r border-black p-1 text-right bg-gray-50">{formatNumber(item.totalQty)}</td>
                  <td className="p-1 text-right font-bold">{formatNumber(currentAmount)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
             <tr className="bg-gray-800 text-white font-bold">
                <td colSpan={7} className="p-2 text-right">TOPLAM BU DÖNEM İMALATI:</td>
                <td className="p-2 text-right">{formatCurrency(grandTotalAmount)}</td>
             </tr>
          </tfoot>
        </table>

        <SignatureBlock />
      </div>

      {/* --------------------------------------------------------- */}
      {/* SAYFA 4: METRAJ CETVELLERİ */}
      {/* --------------------------------------------------------- */}
      {/* Metrajlar uzun olabilir, bunları tek bir page container'a sığdırmak yerine, akışına bırakıp CSS'e emanet ediyoruz veya her cetveli yeni sayfada başlatıyoruz */}
      {/* Ancak en temiz yöntem, metrajları da report-page içine almaktır. Eğer metraj çok uzunsa ve sığmıyorsa yeni sayfa açılmalıdır. */}
      {/* Basit çözüm: Metrajları da report-page içine koyuyoruz, overflow olursa print stilimiz bunu bölecektir. */}
      
      <div className="report-page block">
        <Header title="METRAJ CETVELLERİ" />
        
        <div className="space-y-6">
          {sheets.map((sheet, index) => (
            <div key={sheet.id} className="break-inside-avoid border border-black mb-4">
              <div className="bg-gray-200 border-b border-black p-1.5 flex justify-between font-bold text-xs">
                <span>{index + 1}. {sheet.groupName}</span>
                <span>Poz: {sheet.code}</span>
              </div>
              
              <table className="w-full text-xs border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border-r border-black p-1 text-left w-[40%]">Açıklama</th>
                    <th className="border-r border-black p-1 w-[12%] text-center">En</th>
                    <th className="border-r border-black p-1 w-[12%] text-center">Boy</th>
                    <th className="border-r border-black p-1 w-[12%] text-center">Yük.</th>
                    <th className="border-r border-black p-1 w-[8%] text-center">Adet</th>
                    <th className="p-1 w-[16%] text-right">Miktar</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.measurements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-300">
                      <td className="border-r border-black p-1 truncate">{m.description}</td>
                      <td className="border-r border-black p-1 text-center">{formatNumber(m.width)}</td>
                      <td className="border-r border-black p-1 text-center">{formatNumber(m.length)}</td>
                      <td className="border-r border-black p-1 text-center">{formatNumber(m.height)}</td>
                      <td className="border-r border-black p-1 text-center font-bold">{formatNumber(m.count)}</td>
                      <td className="p-1 text-right font-mono">{formatNumber(calculateMeasurementRow(m))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={5} className="border-t border-r border-black p-1 text-right">TOPLAM ({sheet.unit}):</td>
                    <td className="border-t border-black p-1 text-right">{formatNumber(sheet.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};