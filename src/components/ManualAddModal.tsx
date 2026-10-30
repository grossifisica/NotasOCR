import React, { useState } from 'react';
import { X, UserPlus, Plus } from 'lucide-react';
import { ExamRecord, AppSettings } from '../types';
import { getStatus } from '../utils/csv';

interface ManualAddModalProps {
  settings: AppSettings;
  onAdd: (record: ExamRecord) => void;
  onClose: () => void;
}

export const ManualAddModal: React.FC<ManualAddModalProps> = ({
  settings,
  onAdd,
  onClose,
}) => {
  const [studentName, setStudentName] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState((settings.maxScoreDefault || 10).toString());
  const [classroom, setClassroom] = useState(settings.defaultClassroom || '');
  const [subject, setSubject] = useState(settings.defaultSubject || '');
  const [observations, setObservations] = useState('');

  const parsedScore = parseFloat(score.replace(',', '.')) || 0;
  const parsedMax = parseFloat(maxScore.replace(',', '.')) || 10;
  const currentStatus = getStatus(parsedScore, parsedMax, settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const newRecord: ExamRecord = {
      id: 'manual_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      studentName: studentName.trim(),
      score: parsedScore,
      maxScore: parsedMax,
      classroom: classroom.trim(),
      subject: subject.trim(),
      observations: observations.trim(),
      confidence: 'alta',
      createdAt: Date.now(),
    };

    onAdd(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-left shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">Adicionar Aluno Manualmente</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome do Aluno:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ex: Ana Carolina Silva"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nota:
              </label>
              <input
                type="text"
                required
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Ex: 8.5 ou 8,5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nota Máxima:
              </label>
              <input
                type="text"
                required
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Turma / Série:
              </label>
              <input
                type="text"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                placeholder="Ex: 9º Ano A"
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
                placeholder="Ex: Português"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações:
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Prova de segunda chamada..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

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
              <Plus className="w-4 h-4" />
              <span>Adicionar à Tabela</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
