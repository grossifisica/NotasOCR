import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Settings2,
  Table,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamRecord, AppSettings } from '../types';
import { downloadCSV, shareCSV, copyTableToClipboard, generateCSV } from '../utils/csv';

interface ExportModalProps {
  records: ExamRecord[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  records,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [filename, setFilename] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const turma = records[0]?.classroom ? records[0].classroom.replace(/\s+/g, '_') : 'Turma';
    return `Notas_${turma}_${today}.csv`;
  });

  const [delimiter, setDelimiter] = useState<';' | ','>(settings.csvDelimiter);

  // Trigger celebration confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // Ignore
    }
  };

  const handleDownload = () => {
    const updated = { ...settings, csvDelimiter: delimiter };
    onUpdateSettings(updated);
    downloadCSV(records, updated, filename);
    triggerCelebration();
  };

  const handleShare = async () => {
    const updated = { ...settings, csvDelimiter: delimiter };
    onUpdateSettings(updated);
    await shareCSV(records, updated, filename);
  };

  const handleCopy = async () => {
    const success = await copyTableToClipboard(records, settings);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Preview first 3 rows of CSV
  const csvPreview = generateCSV(records.slice(0, 4), { ...settings, csvDelimiter: delimiter });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Exportar Nome e Nota (CSV)</h3>
              <p className="text-xs text-slate-400">{records.length} aluno(s) • Colunas: Nome do Aluno e Nota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Filename Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Arquivo CSV:
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Delimiter Selection (Brazil Excel uses semicolon ;) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Separador de Colunas (Delimitador):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDelimiter(';')}
                className={`p-3 rounded-xl border text-left transition ${
                  delimiter === ';'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs text-emerald-400">Ponto e Vírgula (;)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Padrão Excel no Brasil (acentos e vírgula decimal perfeitos)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDelimiter(',')}
                className={`p-3 rounded-xl border text-left transition ${
                  delimiter === ','
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs text-indigo-400">Vírgula (,)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Padrão Internacional / Google Sheets direto
                </div>
              </button>
            </div>
          </div>

          {/* Quick Preview Box */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Pré-visualização do CSV:
            </label>
            <pre className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-24 leading-relaxed">
              {csvPreview}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo CSV (.csv)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShare}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compartilhar / Zap</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Tabela'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
