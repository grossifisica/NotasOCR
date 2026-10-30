export interface ExamRecord {
  id: string;
  studentName: string;
  score: number;
  maxScore: number;
  subject: string;
  classroom: string;
  examDate?: string;
  confidence?: 'alta' | 'media' | 'baixa' | string;
  observations?: string;
  photoUrl?: string; // Data URL or thumbnail
  createdAt: number;
}

export interface ScanQueueItem {
  id: string;
  imageBase64: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  result?: Partial<ExamRecord>;
  createdAt: number;
}

export type GradeStatus = 'aprovado' | 'recuperacao' | 'reprovado';

export interface AppSettings {
  minPassingGrade: number; // e.g. 6.0 or 7.0
  recoveryGrade: number;   // e.g. 5.0
  maxScoreDefault: number; // e.g. 10.0
  csvDelimiter: ';' | ',';
  defaultClassroom: string;
  defaultSubject: string;
  continuousMode: boolean;
  soundEnabled: boolean;
}
