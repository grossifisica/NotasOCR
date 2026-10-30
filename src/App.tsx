/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Images, 
  Table, 
  BarChart3, 
  Settings as SettingsIcon, 
  Download, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X,
  Upload
} from 'lucide-react';
import { GalleryPickerView } from './components/GalleryPickerView';
import { TableView } from './components/TableView';
import { StatsView } from './components/StatsView';
import { ExportModal } from './components/ExportModal';
import { EditExamModal } from './components/EditExamModal';
import { SettingsModal } from './components/SettingsModal';
import { ManualAddModal } from './components/ManualAddModal';

import { ExamRecord, ScanQueueItem, AppSettings } from './types';
import { 
  loadSettings, 
  saveSettings, 
  loadExamRecords, 
  saveExamRecords, 
  createThumbnail 
} from './utils/storage';
import { scanExamApi, playSuccessSound, triggerHaptic } from './services/api';
import { sampleExamsList, generateSampleExamImage } from './utils/sampleExams';

export default function App() {
  // Navigation Tabs: Gallery Picker, Table, Stats
  const [activeTab, setActiveTab] = useState<'gallery' | 'table' | 'stats'>('gallery');
  
  // App Data & Settings
  const [records, setRecords] = useState<ExamRecord[]>(() => loadExamRecords());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  
  // Modals
  const [editingRecord, setEditingRecord] = useState<ExamRecord | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

  // Background Processing Queue for Gallery Photos
  const [queue, setQueue] = useState<ScanQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [latestToast, setLatestToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Desktop Mobile Simulator Frame Toggle (only affects large screens)
  const [isSimulatedMobileView, setIsSimulatedMobileView] = useState(true);

  // Auto-save records to localStorage
  useEffect(() => {
    saveExamRecords(records);
  }, [records]);

  // Auto-save settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Queue Processing Worker: Analyzes gallery photos sequentially
  useEffect(() => {
    if (isProcessingQueue) return;

    const pendingItem = queue.find((item) => item.status === 'pending');
    if (!pendingItem) return;

    const processItem = async (item: ScanQueueItem) => {
      setIsProcessingQueue(true);
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q))
      );

      try {
        // Call backend Gemini Vision analysis
        const extracted = await scanExamApi(item.imageBase64, {
          classroom: settings.defaultClassroom,
          subject: settings.defaultSubject,
          maxScore: settings.maxScoreDefault,
        });

        // Generate lightweight thumbnail for fast mobile loading
        const thumbnail = await createThumbnail(item.imageBase64, 300, 400);

        const newRecord: ExamRecord = {
          id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          studentName: extracted.studentName || 'Não identificado',
          score: typeof extracted.score === 'number' ? extracted.score : parseFloat(String(extracted.score)) || 0,
          maxScore: extracted.maxScore || settings.maxScoreDefault || 10,
          classroom: extracted.classroom || settings.defaultClassroom || 'Geral',
          subject: extracted.subject || settings.defaultSubject || 'Geral',
          examDate: extracted.examDate,
          confidence: extracted.confidence || 'alta',
          observations: extracted.observations,
          photoUrl: thumbnail,
          createdAt: Date.now(),
        };

        setRecords((prev) => [newRecord, ...prev]);

        // Feedback sound & haptic
        if (settings.soundEnabled) {
          playSuccessSound();
        }
        triggerHaptic(50);

        // Toast notification
        setLatestToast({
          message: `Identificado: ${newRecord.studentName} — Nota: ${newRecord.score.toFixed(1).replace('.', ',')}`,
          type: 'success',
        });

        // Mark item as done in the queue
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'done', result: newRecord } : q
          )
        );
      } catch (err: any) {
        console.error('Falha ao processar foto da galeria:', err);
        let errorMsg = err?.message || 'Falha ao processar foto';

        if (errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('demanda')) {
          errorMsg = 'Os servidores do Google estão com pico temporário de demanda. Aguarde alguns segundos e clique em Tentar no item.';
        }

        setLatestToast({
          message: errorMsg,
          type: 'error',
        });

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'error', errorMessage: errorMsg } : q
          )
        );
      } finally {
        setIsProcessingQueue(false);
      }
    };

    processItem(pendingItem);
  }, [queue, isProcessingQueue, settings]);

  // Handle photos selected from phone gallery
  const handleFilesSelected = useCallback((base64Images: string[]) => {
    const newItems: ScanQueueItem[] = base64Images.map((img, i) => ({
      id: 'gallery_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6),
      imageBase64: img,
      status: 'pending',
      createdAt: Date.now(),
    }));

    setQueue((prev) => [...prev, ...newItems]);
    setLatestToast({
      message: `${base64Images.length} ${base64Images.length === 1 ? 'foto selecionada da galeria!' : 'fotos selecionadas da galeria!'} A IA está analisando...`,
      type: 'info',
    });
  }, []);

  // Queue item controls
  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRetryQueueItem = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'pending', errorMessage: undefined } : item))
    );
  };

  const handleClearQueue = () => {
    setQueue([]);
  };

  // Pre-load simulated test exams
  const handleLoadSamples = () => {
    const sampleImages = sampleExamsList.map((sample) => generateSampleExamImage(sample));
    handleFilesSelected(sampleImages);
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeleteBulk = (ids: string[]) => {
    setRecords((prev) => prev.filter((r) => !ids.includes(r.id)));
  };

  // Update Record
  const handleSaveRecord = (updated: ExamRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Clear toast after 4s
  useEffect(() => {
    if (latestToast) {
      const timer = setTimeout(() => setLatestToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [latestToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Desktop view switcher banner (only visible on wide screens) */}
      <div className="hidden lg:flex w-full bg-slate-900/80 border-b border-slate-800 px-6 py-2 items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">📱 Aplicativo Mobile: Leitor de Provas da Galeria</span>
          <span className="text-slate-500">|</span>
          <span>Selecione fotos da galeria para identificar nomes e notas com IA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Visualização:</span>
          <button
            onClick={() => setIsSimulatedMobileView(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              isSimulatedMobileView ? 'bg-indigo-600 text-white font-medium' : 'hover:text-white bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Simulador Celular</span>
          </button>
          <button
            onClick={() => setIsSimulatedMobileView(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              !isSimulatedMobileView ? 'bg-indigo-600 text-white font-medium' : 'hover:text-white bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Tela Cheia</span>
          </button>
        </div>
      </div>

      {/* Main Container: Mobile Frame on Desktop or 100% on actual Mobile */}
      <div
        className={`w-full transition-all duration-300 ${
          isSimulatedMobileView
            ? 'max-w-md my-0 sm:my-6 sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl sm:ring-1 sm:ring-slate-700/50 min-h-screen sm:min-h-[850px] bg-slate-950 relative flex flex-col justify-between'
            : 'max-w-4xl p-4 sm:p-6 min-h-screen flex flex-col justify-between'
        }`}
      >
        {/* Top Mobile Status Header */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Gabarito Galeria</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  IA
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                {records.length} {records.length === 1 ? 'aluno tabulado' : 'alunos tabulados'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {records.length > 0 && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-95"
                title="Exportar tabela para CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">CSV</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition"
              title="Configurações de Notas"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {latestToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <div
              className={`p-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-2 border text-xs animate-in fade-in slide-in-from-top-2 ${
                latestToast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : latestToast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                  : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {latestToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : latestToast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                )}
                <span className="font-medium">{latestToast.message}</span>
              </div>
              <button onClick={() => setLatestToast(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content View per Tab */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto">
          {activeTab === 'gallery' && (
            <GalleryPickerView
              queue={queue}
              isProcessing={isProcessingQueue}
              onFilesSelected={handleFilesSelected}
              onRemoveQueueItem={handleRemoveQueueItem}
              onRetryQueueItem={handleRetryQueueItem}
              onClearQueue={handleClearQueue}
              onNavigateToTable={() => setActiveTab('table')}
              processedCount={records.length}
            />
          )}

          {activeTab === 'table' && (
            <TableView
              records={records}
              settings={settings}
              onEditRecord={(record) => setEditingRecord(record)}
              onDeleteRecord={handleDeleteRecord}
              onDeleteBulk={handleDeleteBulk}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenManualAdd={() => setIsManualAddOpen(true)}
              onOpenScan={() => setActiveTab('gallery')}
              onLoadSamples={handleLoadSamples}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView
              records={records}
              settings={settings}
              onOpenExport={() => setIsExportOpen(true)}
            />
          )}
        </main>

        {/* Mobile Thumb-Friendly Bottom Navigation Bar */}
        <nav className="sticky bottom-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2 flex items-center justify-around">
          {/* Gallery Picker Tab */}
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'gallery'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${
              activeTab === 'gallery' ? 'bg-indigo-600/20 text-indigo-400' : ''
            }`}>
              <Images className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Galeria</span>
          </button>

          {/* Table Tab */}
          <button
            onClick={() => setActiveTab('table')}
            className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'table'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${
              activeTab === 'table' ? 'bg-indigo-600/20 text-indigo-400' : ''
            }`}>
              <Table className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Tabela</span>
            {records.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-indigo-600 text-[9px] font-mono text-white flex items-center justify-center font-bold">
                {records.length > 99 ? '99+' : records.length}
              </span>
            )}
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition active:scale-90 ${
              activeTab === 'stats'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${
              activeTab === 'stats' ? 'bg-indigo-600/20 text-indigo-400' : ''
            }`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Métricas</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition active:scale-90"
          >
            <div className="p-1.5 rounded-xl">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Ajustes</span>
          </button>
        </nav>
      </div>

      {/* Modals */}
      {editingRecord && (
        <EditExamModal
          record={editingRecord}
          settings={settings}
          onSave={handleSaveRecord}
          onDelete={handleDeleteRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {isExportOpen && (
        <ExportModal
          records={records}
          settings={settings}
          onUpdateSettings={(updated) => setSettings(updated)}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={(updated) => setSettings(updated)}
          onClearAll={() => {
            setRecords([]);
            setLatestToast({ message: 'Todas as provas foram removidas.', type: 'info' });
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isManualAddOpen && (
        <ManualAddModal
          settings={settings}
          onAdd={(newRec) => {
            setRecords((prev) => [newRec, ...prev]);
            setLatestToast({
              message: `Aluno ${newRec.studentName} adicionado!`,
              type: 'success',
            });
          }}
          onClose={() => setIsManualAddOpen(false)}
        />
      )}
    </div>
  );
}
