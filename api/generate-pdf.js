import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import path from 'path'; // YENİ: path kütüphanesini içeri aktarıyoruz

export default async function handler(req, res) {
  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Sadece POST metoduna izin verilir.' });
  }

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ message: 'HTML içeriği gönderilmedi.' });
    }

    // Vercel'da miyiz yoksa Localhost'ta mıyız kontrolü
    const isLocal = !process.env.VERCEL;

    let browser;
    
    if (isLocal) {
      // Localhost'ta çalışırken standart puppeteer kullanılır
      const puppeteer = await import('puppeteer');
      browser = await puppeteer.default.launch({
        headless: "new",
      });
    } else {
      // YENİ: Chromium exe yolunu alıyoruz
      const executablePath = await chromium.executablePath();
      
      // YENİ VE ÇOK ÖNEMLİ: Çıkartılan libnss3.so kütüphanesinin Chromium tarafından bulunabilmesi için path'i belirtiyoruz
      const execDir = path.dirname(executablePath);
      process.env.LD_LIBRARY_PATH = execDir; 

      // Vercel üzerinde çalışırken Sparticuz Chromium kullanılır
      browser = await puppeteerCore.launch({
        args: [...chromium.args, '--disable-dev-shm-usage', '--no-sandbox'], 
        defaultViewport: chromium.defaultViewport,
        executablePath: executablePath,
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();

    // Tailwind ve resimlerin yüklenmesi için networkidle0 bekliyoruz
    await page.setContent(html, { waitUntil: 'networkidle2' });

    // PDF Üretim Ayarları
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, 
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    await browser.close();

    // Üretilen PDF'i Front-end'e geri yolla
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapor.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Üretim Hatası:', error);
    res.status(500).json({ error: 'PDF oluşturulurken sunucu hatası meydana geldi.' });
  }
}