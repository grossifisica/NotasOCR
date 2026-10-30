import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Users, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ExamRecord, AppSettings } from '../types';
import { getStatus } from '../utils/csv';

interface StatsViewProps {
  records: ExamRecord[];
  settings: AppSettings;
  onOpenExport: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ records, settings, onOpenExport }) => {
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        total: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        approvedCount: 0,
        recoveryCount: 0,
        disapprovedCount: 0,
        approvedPct: 0,
        buckets: [
          { label: '9,0 - 10,0', count: 0, color: 'bg-emerald-500' },
          { label: '7,0 - 8,9', count: 0, color: 'bg-teal-500' },
          { label: '5,0 - 6,9', count: 0, color: 'bg-amber-500' },
          { label: '0,0 - 4,9', count: 0, color: 'bg-rose-500' },
        ],
      };
    }

    let sum = 0;
    let highest = -Infinity;
    let lowest = Infinity;
    let approved = 0;
    let recovery = 0;
    let disapproved = 0;

    const buckets = [
      { label: '9,0 - 10,0 (Excelente)', count: 0, color: 'bg-emerald-500' },
      { label: '7,0 - 8,9 (Bom)', count: 0, color: 'bg-teal-500' },
      { label: '5,0 - 6,9 (Regular)', count: 0, color: 'bg-amber-500' },
      { label: '0,0 - 4,9 (Insuficiente)', count: 0, color: 'bg-rose-500' },
    ];

    records.forEach((rec) => {
      // Normalize to 10
      const normScore = rec.maxScore > 0 ? (rec.score / rec.maxScore) * 10 : rec.score;
      sum += normScore;

      if (normScore > highest) highest = normScore;
      if (normScore < lowest) lowest = normScore;

      const st = getStatus(rec.score, rec.maxScore || 10, settings).key;
      if (st === 'aprovado') approved++;
      else if (st === 'recuperacao') recovery++;
      else disapproved++;

      if (normScore >= 9.0) buckets[0].count++;
      else if (normScore >= 7.0) buckets[1].count++;
      else if (normScore >= 5.0) buckets[2].count++;
      else buckets[3].count++;
    });

    const average = sum / records.length;
    const approvedPct = (approved / records.length) * 100;

    return {
      total: records.length,
      average: Number(average.toFixed(2)),
      highest: Number(highest.toFixed(1)),
      lowest: Number(lowest.toFixed(1)),
      approvedCount: approved,
      recoveryCount: recovery,
      disapprovedCount: disapproved,
      approvedPct: Number(approvedPct.toFixed(1)),
      buckets,
    };
  }, [records, settings]);

  if (records.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-500" />
        <p className="text-white font-medium mb-1">Sem dados suficientes para estatísticas</p>
        <p className="text-xs">Fotografe provas ou carregue exemplos para visualizar as métricas da turma.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Média */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Média da Turma</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">
              {stats.average.toFixed(1).replace('.', ',')}
            </span>
            <span className="text-xs text-slate-500">/ 10,0</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.average >= settings.minPassingGrade ? 'Turma acima do corte' : 'Abaixo da meta de aprovação'}
          </div>
        </div>

        {/* Taxa de Aprovação */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Aprovação</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.approvedPct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.approvedCount} de {stats.total} alunos aprovados
          </div>
        </div>

        {/* Maior Nota */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Maior Nota</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats.highest.toFixed(1).replace('.', ',')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Melhor pontuação</div>
        </div>

        {/* Menor Nota */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Menor Nota</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {stats.lowest.toFixed(1).replace('.', ',')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pontuação mais baixa</div>
        </div>
      </div>

      {/* Grade Distribution Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center justify-between">
          <span>Distribuição de Notas</span>
          <span className="text-slate-400 font-normal">{stats.total} Provas</span>
        </h4>

        {/* Proportional bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-950">
          {stats.buckets.map((b, i) => {
            const pct = stats.total > 0 ? (b.count / stats.total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={i}
                className={`${b.color} transition-all duration-300`}
                style={{ width: `${pct}%` }}
                title={`${b.label}: ${b.count} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
          {stats.buckets.map((b, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${b.color}`} />
                <span className="text-slate-300 text-[11px]">{b.label}</span>
              </div>
              <span className="font-bold font-mono text-white text-xs">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA to export */}
      <div className="pt-2">
        <button
          onClick={onOpenExport}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Relatório Completo em CSV</span>
        </button>
      </div>
    </div>
  );
};
