import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Copy, 
  Trash2, 
  Edit3, 
  Plus, 
  ExternalLink,
  CheckSquare,
  Square,
  Sparkles,
  Images,
  Check,
  AlertCircle
} from 'lucide-react';
import { ExamRecord, AppSettings } from '../types';
import { getStatus, copyTableToClipboard } from '../utils/csv';

interface TableViewProps {
  records: ExamRecord[];
  settings: AppSettings;
  onEditRecord: (record: ExamRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteBulk: (ids: string[]) => void;
  onOpenExport: () => void;
  onOpenManualAdd: () => void;
  onOpenScan: () => void;
  onLoadSamples: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  records,
  settings,
  onEditRecord,
  onDeleteRecord,
  onDeleteBulk,
  onOpenExport,
  onOpenManualAdd,
  onOpenScan,
  onLoadSamples,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aprovado' | 'recuperacao' | 'reprovado'>('all');
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Distinct classrooms in the list
  const distinctClassrooms = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.classroom) set.add(r.classroom);
    });
    return Array.from(set);
  }, [records]);

  // Filtered and sorted records - Always alphabetically sorted by studentName
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Search term
        const matchesSearch = 
          rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (rec.classroom && rec.classroom.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (rec.subject && rec.subject.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // Classroom
        if (classroomFilter !== 'all' && rec.classroom !== classroomFilter) {
          return false;
        }

        // Status
        if (statusFilter !== 'all') {
          const status = getStatus(rec.score, rec.maxScore || 10, settings).key;
          if (status !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          const diff = a.score - b.score;
          return sortOrder === 'asc' ? diff : -diff;
        }
        // Always default to alphabetical A-Z with Portuguese locale
        const diff = a.studentName.localeCompare(b.studentName, 'pt-BR', { sensitivity: 'base' });
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [records, searchTerm, statusFilter, classroomFilter, sortBy, sortOrder, settings]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopyTable = async () => {
    const success = await copyTableToClipboard(filteredRecords, settings);
    if (success) {
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} prova(s) selecionada(s)?`)) {
      onDeleteBulk(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3 pb-20">
      {/* Top Bar with Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExport}
            disabled={records.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition active:scale-95"
            title="Exportar arquivo CSV contendo apenas Nome do Aluno e Nota"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV (Nome e Nota)</span>
          </button>

          <button
            onClick={handleCopyTable}
            disabled={records.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95"
            title="Copiar Nome e Nota para colar no Excel ou Google Planilhas"
          >
            {copiedFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden xs:inline">{copiedFeedback ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={onOpenManualAdd}
            className="flex items-center justify-center gap-1 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition active:scale-95"
            title="Adicionar aluno manualmente"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>

        {/* Bulk selection action if any selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-rose-300">
              {selectedIds.length} selecionado(s)
            </span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-3 shadow-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do aluno, turma ou matéria..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('aprovado')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'aprovado'
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-slate-800/60 text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Aprovados
            </button>
            <button
              onClick={() => setStatusFilter('recuperacao')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'recuperacao'
                  ? 'bg-amber-600/90 text-white'
                  : 'bg-slate-800/60 text-amber-400/80 hover:text-amber-300'
              }`}
            >
              Recuperação
            </button>
            <button
              onClick={() => setStatusFilter('reprovado')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'reprovado'
                  ? 'bg-rose-600/90 text-white'
                  : 'bg-slate-800/60 text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Reprovados
            </button>
          </div>

          {/* Sort Controls & Classroom Selector */}
          <div className="flex items-center gap-2 ml-auto">
            {distinctClassrooms.length > 0 && (
              <select
                value={classroomFilter}
                onChange={(e) => setClassroomFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
              >
                <option value="all">Todas as Turmas</option>
                {distinctClassrooms.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-medium text-xs">
              <span>Ordem Alfabética (A-Z)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Record Cards */}
      {filteredRecords.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center my-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Images className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma prova cadastrada ainda</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-5">
            Selecione fotos de avaliações da galeria do seu celular para tabular notas e nomes automaticamente com IA.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onOpenScan}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Images className="w-4 h-4" />
              <span>Selecionar da Galeria</span>
            </button>
            <button
              onClick={onLoadSamples}
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Carregar Exemplos Prontos</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mobile-first Cards / Responsive Table Header */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 w-16">Foto</th>
                  <th className="p-3 font-semibold">Aluno</th>
                  <th className="p-3 font-semibold text-center w-24">Nota</th>
                  <th className="p-3 font-semibold text-center w-28">Situação</th>
                  <th className="p-3 font-semibold">Turma / Matéria</th>
                  <th className="p-3 font-semibold">Observações</th>
                  <th className="p-3 font-semibold text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((rec) => {
                  const status = getStatus(rec.score, rec.maxScore || 10, settings);
                  const isSelected = selectedIds.includes(rec.id);
                  const scorePercent = rec.maxScore > 0 ? (rec.score / rec.maxScore) * 100 : 0;

                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={() => toggleSelect(rec.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        {rec.photoUrl ? (
                          <button
                            onClick={() => onEditRecord(rec)}
                            className="relative group w-11 h-14 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0"
                          >
                            <img
                              src={rec.photoUrl}
                              alt={rec.studentName}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ExternalLink className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-11 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                            -
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white text-sm">
                          {rec.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{rec.examDate || new Date(rec.createdAt).toLocaleDateString('pt-BR')}</span>
                          {rec.confidence && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                rec.confidence === 'alta'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : rec.confidence === 'media'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              IA: {rec.confidence}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono text-base font-bold text-white">
                            {rec.score.toFixed(1).replace('.', ',')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            / {(rec.maxScore || 10).toFixed(1).replace('.', ',')}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            status.key === 'aprovado'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : status.key === 'recuperacao'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-slate-200 font-medium">{rec.classroom || '-'}</div>
                        <div className="text-[11px] text-slate-400">{rec.subject || '-'}</div>
                      </td>
                      <td className="p-3 text-xs text-slate-400 max-w-xs truncate">
                        {rec.observations || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditRecord(rec)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                            title="Editar dados"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
                            title="Excluir prova"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Smartphone Optimized Card List (Visible on mobile screens) */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5 hover:text-white">
                {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Selecionar todos ({filteredRecords.length})</span>
              </button>
              <span>Exibindo {filteredRecords.length} aluno(s)</span>
            </div>

            {filteredRecords.map((rec) => {
              const status = getStatus(rec.score, rec.maxScore || 10, settings);
              const isSelected = selectedIds.includes(rec.id);

              return (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-2xl bg-slate-900 border transition ${
                    isSelected ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(rec.id)}
                      className="mt-1 text-slate-400 hover:text-white flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {/* Thumbnail */}
                    {rec.photoUrl && (
                      <button
                        onClick={() => onEditRecord(rec)}
                        className="w-12 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0 relative group"
                      >
                        <img src={rec.photoUrl} alt={rec.studentName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-active:opacity-100 flex items-center justify-center">
                          <ExternalLink className="w-3 h-3 text-white" />
                        </div>
                      </button>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0" onClick={() => onEditRecord(rec)}>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {rec.studentName}
                        </h4>
                        <div className="flex items-center gap-1 font-mono">
                          <span className={`text-base font-bold ${
                            status.key === 'aprovado'
                              ? 'text-emerald-400'
                              : status.key === 'recuperacao'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {rec.score.toFixed(1).replace('.', ',')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            / {(rec.maxScore || 10).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            status.key === 'aprovado'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : status.key === 'recuperacao'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {status.label}
                        </span>

                        {rec.classroom && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-medium text-slate-300">
                            {rec.classroom}
                          </span>
                        )}

                        {rec.subject && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                            {rec.subject}
                          </span>
                        )}
                      </div>

                      {rec.observations && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                          "{rec.observations}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => onEditRecord(rec)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(rec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
