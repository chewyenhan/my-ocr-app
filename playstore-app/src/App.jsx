import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload, X, Settings, Copy, Download, Printer, ChevronUp, ChevronDown,
  GripVertical, Zap, Camera, Image, HelpCircle, Check, Languages, ExternalLink
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { jsPDF } from 'jspdf';
import './i18n/index.js';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function App() {
  const { t, i18n } = useTranslation();
  const [images, setImages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('snaptext_api_key') || '');
  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem('snaptext_settings');
      return s ? JSON.parse(s) : { pageSize: 'a4', fontSize: 12, addPageBreak: true };
    } catch { return { pageSize: 'a4', fontSize: 12, addPageBreak: true }; }
  });
  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);

  useEffect(() => { localStorage.setItem('snaptext_api_key', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('snaptext_settings', JSON.stringify(settings)); }, [settings]);

  const activeImage = images.find(img => img.id === activeId) || null;

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;

    const baseIndex = imagesRef.current.length;
    const newImages = validFiles.map((file, i) => {
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result.split(',')[1];
        setImages(prev => prev.map(img => img.id === id ? { ...img, data, status: 'pending' } : img));
      };
      reader.readAsDataURL(file);

      return {
        id, name: file.name, url, data: null, mimeType: file.type,
        status: 'loading', extractedText: '', order: baseIndex + i,
      };
    });

    setImages(prev => [...prev, ...newImages]);
    if (!activeId && newImages.length > 0) setActiveId(newImages[0].id);
  }, [activeId]);

  const extractText = useCallback(async (imageId) => {
    if (!apiKey) { alert('Please set your Gemini API Key in Settings first.'); return; }

    // Get latest image data from state
    let imgData = null;
    setImages(prev => {
      const img = prev.find(i => i.id === imageId);
      if (!img || !img.data) return prev;
      imgData = { mimeType: img.mimeType, data: img.data };
      return prev.map(i => i.id === imageId ? { ...i, status: 'extracting' } : i);
    });

    // Wait for state update
    await new Promise(r => setTimeout(r, 50));

    if (!imgData) {
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'error', errorMsg: 'Image data not ready' } : i));
      return;
    }

    try {
      const res = await fetch(`${GEMINI_API}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: imgData.mimeType, data: imgData.data } },
            { text: 'Extract all written and printed text from this image faithfully and accurately. Preserve paragraphs, columns, headers, tables, lists, and spacing where possible. Do not summarize or write introductory/concluding explanations. Only return the exact extracted text.' }
          ]}]
        })
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message || `API Error ${res.status}`); }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, extractedText: text.trim(), status: 'success' } : i));
    } catch (err) {
      setImages(prev => prev.map(i => i.id === imageId ? { ...i, status: 'error', errorMsg: err.message } : i));
    }
  }, [apiKey]);

  const extractAll = useCallback(async () => {
    const pending = imagesRef.current.filter(i => i.status === 'pending' && i.data);
    for (const img of pending) await extractText(img.id);
  }, [extractText]);

  const deleteImage = useCallback((id) => {
    setImages(prev => { const f = prev.filter(i => i.id !== id); if (activeId === id) setActiveId(f[0]?.id || null); return f; });
  }, [activeId]);

  const moveImage = useCallback((id, dir) => {
    setImages(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const t = idx + dir;
      if (t < 0 || t >= sorted.length) return prev;
      [sorted[idx].order, sorted[t].order] = [sorted[t].order, sorted[idx].order];
      return [...sorted];
    });
  }, []);

  const copyAllText = useCallback(async () => {
    const text = [...images].sort((a,b) => a.order - b.order).filter(i => i.status === 'success' && i.extractedText).map(i => i.extractedText).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [images]);

  const downloadTxt = useCallback(async () => {
    const text = [...images].sort((a,b) => a.order - b.order).filter(i => i.status === 'success' && i.extractedText).map(i => i.extractedText).join('\n\n');
    if (!text) { alert('No extracted text to download.'); return; }
    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `extracted_text_${new Date().getTime()}.txt`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: '﻿' + text,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        alert(`File downloaded successfully!\nSaved to: ${result.uri}`);
      } catch (e) {
        console.error('downloadTxt error:', e);
        alert('Download failed: ' + (e.message || 'Unknown error'));
      }
    } else {
      const blob = new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted_text.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    }
  }, [images]);

  const printToPdf = useCallback(async () => {
    const pageSize = settings.pageSize === 'letter' ? 'letter' : 'a4';
    const items = [...images].sort((a,b) => a.order - b.order).filter(i => i.status === 'success' && i.extractedText);
    if (!items.length) { alert('No extracted text to export.'); return; }
    
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;
      
      pdf.setFontSize(settings.fontSize);
      pdf.setFont('SimSun', 'normal');
      
      items.forEach((item, idx) => {
        const text = item.extractedText;
        const lines = pdf.splitTextToSize(text, contentWidth);
        
        lines.forEach((line) => {
          if (yPos + 7 > pageHeight - margin) {
            if (settings.addPageBreak) pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 7;
        });
        
        if (settings.addPageBreak && idx < items.length - 1) {
          pdf.addPage();
          yPos = margin;
        } else if (idx < items.length - 1) {
          yPos += 5;
        }
      });
      
      if (Capacitor.isNativePlatform()) {
        const pdfBlob = pdf.output('blob');
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64data = reader.result.split(',')[1];
            const fileName = `extracted_text_${new Date().getTime()}.pdf`;
            await Filesystem.writeFile({
              path: fileName,
              data: base64data,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });
            alert(`PDF downloaded successfully!\nSaved to: ${fileName}`);
          } catch (e) {
            console.error('Error saving PDF:', e);
            alert('Failed to save PDF: ' + (e.message || 'Unknown error'));
          }
        };
        reader.readAsDataURL(pdfBlob);
      } else {
        pdf.save('extracted_text.pdf');
      }
    } catch (e) {
      console.error('printToPdf error:', e);
      alert('PDF generation failed: ' + (e.message || 'Unknown error'));
    }
  }, [images, settings]);

  const updateText = useCallback((id, text) => {
    setImages(prev => prev.map(i => i.id === id ? { ...i, extractedText: text } : i));
  }, []);

  const hasText = images.some(i => i.status === 'success' && i.extractedText);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172ae6] backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"><Camera size={15} className="text-white" /></div>
            <div><h1 className="text-[13px] font-bold text-white leading-tight">{t('app.title')}</h1><p className="text-[10px] text-slate-400">{t('app.subtitle')}</p></div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setShowGuide(true)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"><HelpCircle size={17} /></button>
            <button onClick={toggleLang} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 flex items-center gap-1"><Languages size={17} /><span className="text-[10px] font-semibold">{t('header.language')}</span></button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"><Settings size={17} /></button>
          </div>
        </div>
      </header>

      {/* Upload Area */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-3">
          <button onClick={() => cameraRef.current?.click()} className="flex-1 flex flex-col items-center gap-2 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all active:scale-95">
            <Camera size={28} className="text-white" />
            <span className="text-[13px] font-bold text-white">{t('upload.takePhoto')}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center gap-2 py-5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all active:scale-95">
            <Image size={28} className="text-slate-300" />
            <span className="text-[13px] font-medium text-slate-300">{t('upload.fromGallery')}</span>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">{t('upload.supported')}</p>
        <input ref={cameraRef} type="file" capture="environment" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Image List + Extract All */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('upload.queue')} ({images.length})</h2>
          {images.filter(i => i.status === 'pending').length > 0 && (
            <button onClick={extractAll} disabled={!apiKey} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-white transition-all">
              <Zap size={12} />{t('upload.extractAll')}
            </button>
          )}
        </div>
        {!images.length ? (
          <p className="text-xs text-slate-600 text-center py-8">{t('upload.empty')}</p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {[...images].sort((a,b) => a.order-b.order).map((img, idx) => (
              <div key={img.id} onClick={() => setActiveId(img.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all ${
                  activeId === img.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                <GripVertical size={13} className="text-slate-600 shrink-0" />
                <img src={img.url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white truncate">Photo {idx + 1}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] ${
                    img.status === 'success' ? 'text-emerald-400' :
                    img.status === 'extracting' ? 'text-blue-400' :
                    img.status === 'error' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      img.status === 'success' ? 'bg-emerald-400' :
                      img.status === 'extracting' ? 'bg-blue-400' :
                      img.status === 'error' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                    {t(`image.status.${img.status === 'pending' || img.status === 'loading' ? 'pending' : img.status === 'extracting' ? 'extracting' : img.status === 'error' ? 'error' : 'success'}`)}
                  </span>
                </div>
                <div className="flex items-center gap-0 shrink-0">
                  <button onClick={e => { e.stopPropagation(); moveImage(img.id, -1); }} className="p-1 text-slate-500 hover:text-white"><ChevronUp size={11} /></button>
                  <button onClick={e => { e.stopPropagation(); moveImage(img.id, 1); }} className="p-1 text-slate-500 hover:text-white"><ChevronDown size={11} /></button>
                  <button onClick={e => { e.stopPropagation(); deleteImage(img.id); }} className="p-1 text-slate-500 hover:text-red-400"><X size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Text Viewer */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        {activeImage ? (
          <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white">
                {t('image.edit')} — Photo {[...images].sort((a,b)=>a.order-b.order).findIndex(i=>i.id===activeId)+1}
              </span>
              <button onClick={() => extractText(activeImage.id)}
                disabled={activeImage.status === 'extracting'}
                className="text-[11px] px-2.5 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg disabled:opacity-30 transition-all">
                {activeImage.status === 'extracting' ? t('upload.extracting') : activeImage.status === 'success' ? '↻ Re-extract' : 'Extract'}
              </button>
            </div>
            <textarea
              value={activeImage.extractedText}
              onChange={e => updateText(activeImage.id, e.target.value)}
              placeholder={activeImage.status === 'success' ? t('viewer.editPlaceholder') : t('viewer.noSelectionHint')}
              className="w-full min-h-[180px] bg-transparent text-[14px] text-slate-200 placeholder-slate-600 resize-none outline-none leading-relaxed"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Image size={36} className="mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">{t('viewer.noSelection')}</p>
            <p className="text-xs text-slate-600 mt-1">{t('viewer.noSelectionHint')}</p>
          </div>
        )}
      </div>

      {/* Export Panel */}
      {hasText && (
        <div className="max-w-lg mx-auto px-4 mt-4 mb-24">
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl p-4 border border-indigo-500/10">
            <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-3">{t('export.title')}</h3>
            <div className="space-y-2">
              <button onClick={copyAllText} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[13px] font-medium transition-all">
                {copied ? <><Check size={15} className="text-emerald-400" />{t('export.copied')}</> : <><Copy size={15} />{t('export.copyAll')}</>}
              </button>
              <button onClick={downloadTxt} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-emerald-600/20">
                <Download size={15} />{t('export.downloadTxt')}
              </button>
              <button onClick={printToPdf} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[13px] font-medium border border-white/5 transition-all">
                <Printer size={15} />{t('export.downloadPdf')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-[10px] text-slate-600 leading-relaxed">
        <p>{t('footer.devBy')}</p>
        <p>{t('footer.poweredBy')}</p>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-[#1e293b] rounded-2xl p-5 w-full max-w-sm border border-white/10 shadow-2xl mx-4 mb-4 sm:mb-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">{t('settings.title')}</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('settings.apiKey')}</label>
                <div className="flex gap-2">
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50" />
                  <button onClick={() => { setShowSettings(false); setShowGuide(true); }} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white"><HelpCircle size={14} /></button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('settings.pageSize')}</label>
                <select value={settings.pageSize} onChange={e => setSettings(s => ({ ...s, pageSize: e.target.value }))} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white outline-none">
                  <option value="a4">{t('settings.a4')}</option>
                  <option value="letter">{t('settings.letter')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('settings.fontSize')}</label>
                <select value={settings.fontSize} onChange={e => setSettings(s => ({ ...s, fontSize: Number(e.target.value) }))} className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white outline-none">
                  <option value="10">10pt</option><option value="12">12pt</option><option value="14">14pt</option><option value="16">16pt</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.addPageBreak} onChange={e => setSettings(s => ({ ...s, addPageBreak: e.target.checked }))} className="w-4 h-4 text-indigo-500 bg-white/5 rounded border-white/10 focus:ring-indigo-500" />
                <span className="text-sm text-slate-300">{t('settings.pageBreak')}</span>
              </label>
              <button onClick={() => setShowSettings(false)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all">{t('settings.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => setShowGuide(false)}>
          <div className="bg-[#1e293b] rounded-2xl p-5 w-full max-w-sm border border-white/10 shadow-2xl mx-4 my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">{t('guide.title')}</h2>
              <button onClick={() => setShowGuide(false)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[1,2,3,4].map(s => (
                <div key={s} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-white">{s}</span></div>
                  <div><p className="text-sm font-semibold text-white">{t(`guide.step${s}`)}</p><p className="text-xs text-slate-400 mt-0.5">{t(`guide.step${s}desc`)}</p></div>
                </div>
              ))}
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs text-indigo-300">{'✨'} {t('guide.free')}</p>
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all">
                <ExternalLink size={15} />{t('guide.openStudio')}
              </a>
              <button onClick={() => setShowGuide(false)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all">{t('guide.gotIt')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
