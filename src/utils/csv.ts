import { ExamRecord, AppSettings } from '../types';

export function getStatus(score: number, maxScore: number, settings: AppSettings): { label: string; key: 'aprovado' | 'recuperacao' | 'reprovado' } {
  const normalized = maxScore > 0 ? (score / maxScore) * 10 : score;
  if (normalized >= settings.minPassingGrade) {
    return { label: 'Aprovado', key: 'aprovado' };
  } else if (normalized >= settings.recoveryGrade) {
    return { label: 'Recuperação', key: 'recuperacao' };
  }
  return { label: 'Reprovado', key: 'reprovado' };
}

/**
 * Generates CSV containing ONLY Student Name and Grade (Nome do Aluno e Nota)
 * with UTF-8 BOM (\uFEFF) for perfect display in Excel, Numbers, and Google Sheets.
 */
export function generateCSV(records: ExamRecord[], settings: AppSettings): string {
  const delimiter = settings.csvDelimiter || ';';
  
  const headers = ['Nome do Aluno', 'Nota'];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const sorted = [...records].sort((a, b) =>
    a.studentName.localeCompare(b.studentName, 'pt-BR', { sensitivity: 'base' })
  );

  const rows = sorted.map((rec) => {
    // Format score in Brazilian format (comma for decimals if using semicolon delimiter)
    const formattedScore = delimiter === ';' 
      ? String(rec.score).replace('.', ',') 
      : String(rec.score);

    return [
      escapeCSV(rec.studentName),
      escapeCSV(formattedScore),
    ].join(delimiter);
  });

  // Include UTF-8 BOM so Excel opens Brazilian Portuguese accented names properly
  return '\uFEFF' + [headers.map(escapeCSV).join(delimiter), ...rows].join('\r\n');
}

export function downloadCSV(records: ExamRecord[], settings: AppSettings, customFilename?: string) {
  const csvContent = generateCSV(records, settings);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = customFilename || `Notas_${dateStr}.csv`;
  
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
  const filename = customFilename || `Notas_${dateStr}.csv`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const file = new File([blob], filename, { type: 'text/csv' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Tabela de Notas',
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
  // Tab-separated values with ONLY Student Name and Grade, sorted alphabetically
  const headers = ['Nome do Aluno', 'Nota'];
  const sorted = [...records].sort((a, b) =>
    a.studentName.localeCompare(b.studentName, 'pt-BR', { sensitivity: 'base' })
  );

  const rows = sorted.map((rec) => {
    const formattedScore = String(rec.score).replace('.', ',');
    return [rec.studentName, formattedScore].join('\t');
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
