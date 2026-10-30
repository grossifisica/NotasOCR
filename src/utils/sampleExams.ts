/**
 * Generates realistic simulated Brazilian school exam headers onto HTML Canvas
 * and converts them into image data URLs for quick testing or demonstration.
 */

export interface SampleExamConfig {
  school: string;
  subject: string;
  studentName: string;
  classroom: string;
  date: string;
  score: string;
  maxScore: string;
  noteColor: string;
  gradeBadge?: string;
}

export const sampleExamsList: SampleExamConfig[] = [
  {
    school: 'COLÉGIO INTEGRADO HORIZONTE',
    subject: 'Matemática - 2º Bimestre',
    studentName: 'Mariana Souza Silveira',
    classroom: '8º Ano B',
    date: '24/10/2026',
    score: '9,5',
    maxScore: '10,0',
    noteColor: '#dc2626',
    gradeBadge: 'Parabéns!',
  },
  {
    school: 'ESCOLA ESTADUAL CARLOS DRUMMOND',
    subject: 'Língua Portuguesa & Literatura',
    studentName: 'Lucas Gabriel Nascimento',
    classroom: '3º Ano E.M.',
    date: '26/10/2026',
    score: '7,0',
    maxScore: '10,0',
    noteColor: '#dc2626',
  },
  {
    school: 'INSTITUTO EDUCACIONAL SÃO PAULO',
    subject: 'Ciências Naturais e Biologia',
    studentName: 'Beatriz Lima de Carvalho',
    classroom: '7º Ano A',
    date: '25/10/2026',
    score: '5,5',
    maxScore: '10,0',
    noteColor: '#b91c1c',
    gradeBadge: 'Atenção na q.4',
  },
  {
    school: 'COLÉGIO INTEGRADO HORIZONTE',
    subject: 'História Geral do Brasil',
    studentName: 'Enzo Rodrigues Ferreira',
    classroom: '8º Ano B',
    date: '28/10/2026',
    score: '10,0',
    maxScore: '10,0',
    noteColor: '#dc2626',
    gradeBadge: 'Excelente! 10★',
  },
];

export function generateSampleExamImage(cfg: SampleExamConfig): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1150;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - realistic lined or white paper with slight grain
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft sheet border shadow
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // School Header
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cfg.school.toUpperCase(), canvas.width / 2, 75);

  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`AVALIAÇÃO REGULAR • ENSINO FUNDAMENTAL & MÉDIO`, canvas.width / 2, 105);

  // Header separator double line
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 125);
  ctx.lineTo(850, 125);
  ctx.stroke();

  // Student details box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 140, 800, 160);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 140, 800, 160);

  // Labels & Data
  ctx.textAlign = 'left';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('DISCIPLINA:', 70, 175);
  ctx.font = 'normal 18px Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(cfg.subject, 195, 175);

  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('TURMA:', 550, 175);
  ctx.font = 'normal 18px Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(cfg.classroom, 630, 175);

  // Student name line
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('NOME DO ALUNO:', 70, 225);
  
  // Simulated handwriting for student name
  ctx.font = 'italic bold 23px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(cfg.studentName, 255, 225);

  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('DATA:', 70, 275);
  ctx.font = 'normal 18px Arial, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(cfg.date, 135, 275);

  // Prominent Teacher Grade Box (Box da Nota)
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(600, 215, 230, 75);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(600, 215, 230, 75);

  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillStyle = '#78350f';
  ctx.fillText('NOTA DO PROFESSOR:', 615, 235);

  // Handwritten Grade in Red Pen
  ctx.save();
  ctx.translate(630, 275);
  ctx.rotate(-0.06); // slight human angle
  ctx.font = 'bold 36px "Segoe Print", "Comic Sans MS", cursive, sans-serif';
  ctx.fillStyle = cfg.noteColor;
  ctx.fillText(`${cfg.score} / ${cfg.maxScore}`, 0, 0);

  // Circular red ink mark around grade
  ctx.beginPath();
  ctx.ellipse(80, -12, 100, 32, -0.05, 0, 2 * Math.PI);
  ctx.strokeStyle = cfg.noteColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (cfg.gradeBadge) {
    ctx.font = 'italic bold 16px Arial, sans-serif';
    ctx.fillText(cfg.gradeBadge, 10, 28);
  }
  ctx.restore();

  // Draw some simulated questions on the paper
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let y = 350; y < 1050; y += 45) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(840, y);
    ctx.stroke();
  }

  // Question headers
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Questão 1: Calcule a área total e o perímetro das figuras geométricas...', 70, 385);
  ctx.fillStyle = '#16a34a'; // Checkmark
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('✓ Certo (+2.5)', 700, 385);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Questão 2: Explique com suas palavras a principal tese abordada no texto...', 70, 520);
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('✓ Certo (+2.5)', 700, 520);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Questão 3: Resolva a equação do segundo grau justificando cada etapa...', 70, 655);
  ctx.fillStyle = parseFloat(cfg.score.replace(',', '.')) >= 7.5 ? '#16a34a' : '#dc2626';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(parseFloat(cfg.score.replace(',', '.')) >= 7.5 ? '✓ Certo (+2.5)' : '✗ Incompleto (+1.0)', 660, 655);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Questão 4: Marque a alternativa correta referente ao ciclo hidrológico...', 70, 790);
  ctx.fillStyle = parseFloat(cfg.score.replace(',', '.')) >= 5.5 ? '#16a34a' : '#dc2626';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(parseFloat(cfg.score.replace(',', '.')) >= 5.5 ? '✓ Certo (+2.5)' : '✗ Errado (0.0)', 700, 790);

  return canvas.toDataURL('image/jpeg', 0.85);
}
