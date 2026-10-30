import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  Trash2, 
  Sliders, 
  Volume2, 
  VolumeX,
  FileSpreadsheet
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (updated: AppSettings) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClearAll,
  onClose,
}) => {
  const [minPassingGrade, setMinPassingGrade] = useState(settings.minPassingGrade.toString());
  const [recoveryGrade, setRecoveryGrade] = useState(settings.recoveryGrade.toString());
  const [maxScoreDefault, setMaxScoreDefault] = useState(settings.maxScoreDefault.toString());
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(settings.csvDelimiter);
  const [defaultClassroom, setDefaultClassroom] = useState(settings.defaultClassroom || '');
  const [defaultSubject, setDefaultSubject] = useState(settings.defaultSubject || '');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [continuousMode, setContinuousMode] = useState(settings.continuousMode ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      minPassingGrade: parseFloat(minPassingGrade) || 6.0,
      recoveryGrade: parseFloat(recoveryGrade) || 5.0,
      maxScoreDefault: parseFloat(maxScoreDefault) || 10.0,
      csvDelimiter,
      defaultClassroom: defaultClassroom.trim(),
      defaultSubject: defaultSubject.trim(),
      soundEnabled,
      continuousMode,
    });
    onClose();
  };

  const handleClear = () => {
    if (window.confirm('Atenção: Deseja apagar TODAS as provas digitalizadas? Esta ação não pode ser desfeita.')) {
      onClearAll();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">Configurações do Leitor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Passing grade criteria */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Critérios de Avaliação
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Média de Aprovação:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={minPassingGrade}
                  onChange={(e) => setMinPassingGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Corte Recuperação:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={recoveryGrade}
                  onChange={(e) => setRecoveryGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Context hints for AI */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Dicas Padrão para a IA (Opcional)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Turma Padrão:
                </label>
                <input
                  type="text"
                  value={defaultClassroom}
                  onChange={(e) => setDefaultClassroom(e.target.value)}
                  placeholder="Ex: 8º Ano A"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Matéria Padrão:
                </label>
                <input
                  type="text"
                  value={defaultSubject}
                  onChange={(e) => setDefaultSubject(e.target.value)}
                  placeholder="Ex: Matemática"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Sound & Feedback */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Preferências
            </h4>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Som do obturador e feedback</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-0"
              />
            </div>
          </div>

          {/* Danger zone */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="w-full py-2.5 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todas as Provas Cadastradas</span>
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
