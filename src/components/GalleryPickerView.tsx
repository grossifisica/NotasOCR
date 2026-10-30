import React, { useRef, useState } from 'react';
import { 
  Images, 
  Upload, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  X, 
  Sparkles, 
  FileText, 
  ArrowRight,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { ScanQueueItem } from '../types';
import { sampleExamsList, generateSampleExamImage, SampleExamConfig } from '../utils/sampleExams';

interface GalleryPickerViewProps {
  queue: ScanQueueItem[];
  isProcessing: boolean;
  onFilesSelected: (base64Images: string[]) => void;
  onRemoveQueueItem: (id: string) => void;
  onRetryQueueItem: (id: string) => void;
  onClearQueue: () => void;
  onNavigateToTable: () => void;
  processedCount: number;
}

export const GalleryPickerView: React.FC<GalleryPickerViewProps> = ({
  queue,
  isProcessing,
  onFilesSelected,
  onRemoveQueueItem,
  onRetryQueueItem,
  onClearQueue,
  onNavigateToTable,
  processedCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Read files as Base64
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (fileArray.length === 0) return;

    const promises = fileArray.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((base64Images) => {
      onFilesSelected(base64Images);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleSampleSelect = (sample: SampleExamConfig) => {
    const dataUrl = generateSampleExamImage(sample);
    setShowDemoModal(false);
    onFilesSelected([dataUrl]);
  };

  const handleSelectAllSamples = () => {
    const images = sampleExamsList.map((sample) => generateSampleExamImage(sample));
    setShowDemoModal(false);
    onFilesSelected(images);
  };

  // Stats calculation for the current batch
  const totalInQueue = queue.length;
  const completedInQueue = queue.filter((item) => item.status === 'done').length;
  const errorInQueue = queue.filter((item) => item.status === 'error').length;
  const pendingInQueue = queue.filter((item) => item.status === 'pending' || item.status === 'processing').length;
  const progressPct = totalInQueue > 0 ? (completedInQueue / totalInQueue) * 100 : 0;

  return (
    <div className="w-full flex flex-col space-y-4 pb-20 select-none">
      {/* Hidden File Input supporting multiple images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />

      {/* Main Gallery Selection Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full rounded-3xl p-6 sm:p-8 cursor-pointer border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center shadow-lg group ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/30 scale-[0.99]'
            : 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/30 via-slate-900/60 to-slate-900/90 hover:border-indigo-400 hover:bg-indigo-950/20'
        }`}
      >
        <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30 group-hover:scale-105 group-hover:bg-indigo-600/30 transition shadow-inner">
          <Images className="w-10 h-10" />
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
          <span>Selecionar Fotos da Galeria</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
            Múltiplas Fotos
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-4">
          Toque para abrir a galeria do seu celular e escolha uma ou várias fotos de provas de alunos.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95">
            <Upload className="w-4 h-4" />
            <span>Abrir Galeria do Celular</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDemoModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Provas de Exemplo</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span>✓ JPEG, PNG, HEIC ou WebP</span>
          <span>•</span>
          <span>✓ Seleção individual ou em lote</span>
        </div>
      </div>

      {/* Quick Action & Tips Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Como obter a melhor leitura das fotos?</span>
        </button>

        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
          >
            Limpar fila
          </button>
        )}
      </div>

      {/* Helpful Tips Panel */}
      {showTips && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between font-semibold text-white">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-4 h-4" /> Dicas para fotos da galeria:
            </span>
            <button onClick={() => setShowTips(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-1 text-slate-400 pl-1">
            <li>• Certifique-se de que o cabeçalho (com o <strong>Nome do Aluno</strong>) e a <strong>Nota</strong> estejam nítidos.</li>
            <li>• Notas anotadas à caneta (vermelha, azul ou preta) são lidas automaticamente pela IA.</li>
            <li>• Você pode selecionar 10, 20 ou mais fotos da galeria de uma só vez; o aplicativo processa cada uma em sequência.</li>
          </ul>
        </div>
      )}

      {/* Live Processing Queue Section */}
      {queue.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pendingInQueue > 0 ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Fila de Análise ({completedInQueue}/{totalInQueue} processadas)
              </h3>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Mais</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Grid of Queued Photos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 pt-1">
            {queue.map((item, idx) => (
              <div
                key={item.id}
                className="relative rounded-2xl bg-slate-950 border border-slate-800/80 p-2 flex flex-col justify-between group overflow-hidden"
              >
                {/* Photo Thumbnail */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 mb-2">
                  <img
                    src={item.imageBase64}
                    alt={`Prova ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                    {item.status === 'processing' && (
                      <div className="flex flex-col items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-xl text-center">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-[9px] font-medium text-indigo-200">Lendo prova...</span>
                      </div>
                    )}

                    {item.status === 'done' && (
                      <div className="flex items-center gap-1 bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/40 px-2 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-300">Concluído</span>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="flex flex-col items-center gap-1 bg-rose-950/90 backdrop-blur-sm border border-rose-500/40 px-2 py-1 rounded-xl text-center">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[9px] font-medium text-rose-200">Falha na leitura</span>
                      </div>
                    )}

                    {item.status === 'pending' && (
                      <span className="text-[10px] bg-black/60 backdrop-blur-sm text-slate-300 px-2 py-0.5 rounded-lg">
                        Na fila #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveQueueItem(item.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/80 transition"
                    title="Remover da fila"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Footer Info / Retry */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate">Prova #{idx + 1}</span>
                  {item.status === 'error' && (
                    <button
                      onClick={() => onRetryQueueItem(item.id)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5 text-[10px]"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Tentar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigate to Table CTA */}
          {processedCount > 0 && (
            <div className="pt-2">
              <button
                onClick={onNavigateToTable}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Ver Tabela com {processedCount} Prova(s) Lida(s)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Demo Modal for testing with sample exams */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ★
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">Provas Prontas para Teste</h3>
                  <p className="text-[11px] text-slate-400">Simule fotos de avaliações escolares</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {sampleExamsList.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleSelect(sample)}
                  className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-between text-left transition group active:scale-[0.98]"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs sm:text-sm">{sample.studentName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                        {sample.classroom}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{sample.subject}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                      {sample.score} <span className="text-[10px] text-slate-500">/ 10</span>
                    </span>
                    <span className="text-[10px] text-indigo-400 group-hover:underline flex items-center gap-0.5 mt-0.5">
                      Analisar <Play className="w-2.5 h-2.5 fill-current" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={handleSelectAllSamples}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisar Todos os 4 Exemplos em Lote</span>
              </button>
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
