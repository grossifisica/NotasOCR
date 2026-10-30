import { ExamRecord, AppSettings } from '../types';

export function getStatus(score: number, maxScore: number, settings: AppSettings): { label: string; key: 'aprovado' | 'recuperacao' | 'reprovado' } {
  // Normalize to 10-scale if needed for comparison
  const normalized = maxScore > 0 ? (score / maxScore) * 10 : score;
  if (normalized >= settings.minPassingGrade) {
    return { label: 'Aprovado', key: 'aprovado' };
  } else if (normalized >= settings.recoveryGrade) {
    return { label: 'Recuperação', key: 'recuperacao' };
  }
  return { label: 'Reprovado', key: 'reprovado' };
}

export function generateCSV(records: ExamRecord[], settings: AppSettings): string {
  const delimiter = settings.csvDelimiter || ';';
  
  const headers = [
    'Nome do Aluno',
    'Nota',
    'Nota Máxima',
    'Porcentagem (%)',
    'Situação',
    'Turma',
    'Disciplina',
    'Data da Prova',
    'Confiança da IA',
    'Observações',
    'Data de Leitura',
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((rec) => {
    const status = getStatus(rec.score, rec.maxScore || 10, settings).label;
    const pct = rec.maxScore > 0 ? ((rec.score / rec.maxScore) * 100).toFixed(1) + '%' : '-';
    const scanDate = new Date(rec.createdAt).toLocaleString('pt-BR');
    
    // Format score in Brazilian format (comma for decimals if using semicolon delimiter)
    const formattedScore = delimiter === ';' 
      ? String(rec.score).replace('.', ',') 
      : String(rec.score);
    const formattedMax = delimiter === ';' 
      ? String(rec.maxScore).replace('.', ',') 
      : String(rec.maxScore);

    return [
      escapeCSV(rec.studentName),
      escapeCSV(formattedScore),
      escapeCSV(formattedMax),
      escapeCSV(pct),
      escapeCSV(status),
      escapeCSV(rec.classroom || '-'),
      escapeCSV(rec.subject || '-'),
      escapeCSV(rec.examDate || '-'),
      escapeCSV(rec.confidence || '-'),
      escapeCSV(rec.observations || ''),
      escapeCSV(scanDate),
    ].join(delimiter);
  });

  // Include UTF-8 BOM so Microsoft Excel opens Brazilian Portuguese characters correctly
  return '\uFEFF' + [headers.map(escapeCSV).join(delimiter), ...rows].join('\r\n');
}

export function downloadCSV(records: ExamRecord[], settings: AppSettings, customFilename?: string) {
  const csvContent = generateCSV(records, settings);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = customFilename || `Notas_Provas_${records[0]?.classroom ? records[0].classroom.replace(/\s+/g, '_') + '_' : ''}${dateStr}.csv`;
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareCSV(records: ExamRecord[], settings: AppSettings, customFilename?: string): Promise<boolean> {
  const csvContent = generateCSV(records, settings);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = customFilename || `Notas_Provas_${dateStr}.csv`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const file = new File([blob], filename, { type: 'text/csv' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Tabela de Notas de Provas',
        text: `Exportação de notas com ${records.length} aluno(s).`,
        files: [file],
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Erro ao compartilhar:', err);
      }
      return false;
    }
  }

  // Fallback to regular download if Web Share API isn't available with files
  downloadCSV(records, settings, filename);
  return true;
}

export async function copyTableToClipboard(records: ExamRecord[], settings: AppSettings): Promise<boolean> {
  // Tab-separated values for easy pasting into Google Sheets / Excel
  const headers = ['Nome do Aluno', 'Nota', 'Nota Máxima', 'Situação', 'Turma', 'Disciplina', 'Observações'];
  const rows = records.map((rec) => {
    const status = getStatus(rec.score, rec.maxScore || 10, settings).label;
    return [
      rec.studentName,
      rec.score.toFixed(1).replace('.', ','),
      (rec.maxScore || 10).toFixed(1).replace('.', ','),
      status,
      rec.classroom || '-',
      rec.subject || '-',
      rec.observations || '',
    ].join('\t');
  });

  const tsv = [headers.join('\t'), ...rows].join('\n');
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Falha ao copiar para clipboard:', err);
    return false;
  }
}
