import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ExamRecord, AppSettings } from '../types';
import { getStatus } from '../utils/csv';

interface EditExamModalProps {
  record: ExamRecord;
  settings: AppSettings;
  onSave: (updated: ExamRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const EditExamModal: React.FC<EditExamModalProps> = ({
  record,
  settings,
  onSave,
  onDelete,
  onClose,
}) => {
  const [studentName, setStudentName] = useState(record.studentName);
  const [score, setScore] = useState(record.score.toString());
  const [maxScore, setMaxScore] = useState((record.maxScore || 10).toString());
  const [classroom, setClassroom] = useState(record.classroom || '');
  const [subject, setSubject] = useState(record.subject || '');
  const [examDate, setExamDate] = useState(record.examDate || '');
  const [observations, setObservations] = useState(record.observations || '');

  // Photo viewer zoom & rotation
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const parsedScore = parseFloat(score.replace(',', '.')) || 0;
  const parsedMax = parseFloat(maxScore.replace(',', '.')) || 10;
  const currentStatus = getStatus(parsedScore, parsedMax, settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...record,
      studentName: studentName.trim() || 'Não identificado',
      score: parsedScore,
      maxScore: parsedMax,
      classroom: classroom.trim(),
      subject: subject.trim(),
      examDate: examDate.trim(),
      observations: observations.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir a prova de ${record.studentName}?`)) {
      onDelete(record.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">Revisão da Prova</span>
            {record.confidence && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                record.confidence === 'alta'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                IA: {record.confidence}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split into Photo preview & form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 overflow-y-auto">
          {/* Photo Section */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300">Foto da Prova</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Girar 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-[3/4] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2">
              {record.photoUrl ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={record.photoUrl}
                    alt={record.studentName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-500">Sem foto disponível</div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Use os botões de zoom para inspecionar a escrita do aluno ou carimbo
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Aluno:
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Score & Max Score */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nota Obtida:
                  </label>
                  <input
                    type="text"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nota Máxima:
                  </label>
                  <input
                    type="text"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Indicator Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400">Situação do Aluno:</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    currentStatus.key === 'aprovado'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : currentStatus.key === 'recuperacao'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {currentStatus.label}
                </span>
              </div>

              {/* Classroom & Subject */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Turma / Série:
                  </label>
                  <input
                    type="text"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    placeholder="Ex: 8º Ano B"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Disciplina:
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Matemática"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Data da Prova:
                </label>
                <input
                  type="text"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações / Detalhes:
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  placeholder="Anotações sobre a correção ou questões..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium transition active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
