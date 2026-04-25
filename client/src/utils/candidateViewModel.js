import { interviewQuestions } from '../config/interviewQuestions';

const LOCATION_LABELS = {
  1: 'פתח תקווה',
  2: 'יקנעם',
  3: 'חריש',
  0: 'לא צוין',
};

const ROLE_LABELS = {
  1: 'מכירות',
  2: 'שירות',
  0: 'לא הוגדר',
};

const SCORE_TO_PARAMETER = [
  ['motivation', 'מוטיבציה'],
  ['verbalAbility', 'וורבליות'],
  ['peopleSkills', 'כישורים בין אישיים'],
  ['salesOrientation', 'אוריינטציה מכירתית'],
  ['targetOrientation', 'אוריינטציה ליעדים'],
];

function normalizePriority(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function scoreToBand(score) {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

// Maps rawAnswers { q1, q2, ... } to [{ question, answer }] using client-side question text.
function normalizeQa(rawAnswers, questions = []) {
  if (!rawAnswers || typeof rawAnswers !== 'object') return [];

  return Object.keys(rawAnswers)
    .sort((a, b) => Number(a.replace('q', '')) - Number(b.replace('q', '')))
    .map((key, idx) => ({
      question: questions[idx] || interviewQuestions[idx]?.text || `שאלה ${idx + 1}`,
      answer: rawAnswers[key] ?? '',
    }));
}

function deriveParameters(scores = {}) {
  return SCORE_TO_PARAMETER.map(([key, label]) => {
    const numericScore = Number(scores[key] ?? 0);
    return { label, value: scoreToBand(numericScore), score: numericScore };
  });
}

// Supports flat Conversation model, flat Candidate model, or legacy nested formats.
// תומך גם ב-populated analysis מ-MongoDB
function extractAnalysisRecord(source = {}) {
  // אם analysis הוא אובייקט מלא (populated), נשתמש בו
  if (source.analysis && typeof source.analysis === 'object' && source.analysis._id) {
    return source.analysis;
  }
  return source.analysis || source.conversation || source.interview || source;
}

export function normalizeCandidate(record = {}) {
  const analysis = extractAnalysisRecord(record);
  
  // טיפול בציון - אם הוא null או undefined, נשתמש ב-0
  const rawFinalScore = analysis.finalScore ?? record.finalScore ?? record.score;
  const finalScore = (rawFinalScore !== null && rawFinalScore !== undefined && !isNaN(Number(rawFinalScore))) 
    ? Number(rawFinalScore) 
    : 0;
  
  const recommendedRole = Number(analysis.recommendedRole ?? record.recommendedRole ?? 0);
  const technical = analysis.technical || record.technical || {};
  const scores = analysis.scores || record.scores || {};
  const parameters = Array.isArray(record.parameters) && record.parameters.length
    ? record.parameters
    : deriveParameters(scores);
  
  // טיפול ב-QA - השרת מחזיר answers כמערך של strings
  const rawAnswers = analysis.answers || analysis.rawAnswers || record.rawAnswers || [];
  const questions = analysis.questions || record.questions || [];

  return {
    // Candidate model fields - תמיכה ב-_id של MongoDB
    id: String(record._id || record.id || analysis._id || analysis.id || analysis.candidateId || ''),
    candidateId: String(record._id || record.candidateId || analysis.candidateId || ''),
    conversationId: String(record.conversationId ?? analysis.conversationId ?? ''),
    fullName: record.fullName || record.name || analysis.fullName || 'ללא שם',
    phone: record.phone || analysis.phone || '',
    email: record.email || analysis.email || '',

    // Derived display fields
    score: Number.isFinite(finalScore) ? Math.round(finalScore) : 0,
    priority: record.priority || normalizePriority(finalScore),
    position: record.position || ROLE_LABELS[recommendedRole] || ROLE_LABELS[0],
    recommendedRole,
    recommendedRoleLabel: ROLE_LABELS[recommendedRole] || ROLE_LABELS[0],

    // Conversation/Analysis model fields
    timestamp: analysis.timestamp || record.timestamp || null,
    technical: {
      location: Number(technical.location ?? 0),
      locationLabel: LOCATION_LABELS[Number(technical.location ?? 0)] || LOCATION_LABELS[0],
      availability: Number(technical.availability ?? 0),
      hasRelativeInCompany: Number(technical.hasRelativeInCompany ?? 0),
    },
    scores,
    experienceLevel: Number(analysis.experienceLevel ?? record.experienceLevel ?? 0),
    aiSummary: analysis.summary || record.aiSummary || '',
    strengths: analysis.insights || record.strengths || [],
    weaknesses: record.weaknesses || [],
    recommendedQuestions: analysis.recommendedQuestions || record.recommendedQuestions || [],
    parameters,
    // QA - אם יש מערך answers מהשרת, נמיר אותו לפורמט עם שאלות
    qa: Array.isArray(record.qa) && record.qa.length 
      ? record.qa 
      : normalizeQaFromAnswers(rawAnswers, questions),
    rawAnswers,
  };
}

// פונקציה חדשה - ממירה מערך תשובות לפורמט QA
function normalizeQaFromAnswers(answers, questions = []) {
  if (!answers || !Array.isArray(answers) || answers.length === 0) return [];
  
  // אם התשובות הן אובייקטים עם question/answer, נחזיר אותם כמו שהם
  if (typeof answers[0] === 'object' && answers[0].question) {
    return answers;
  }
  
  // אם התשובות הן strings, נחבר אותן עם השאלות מ-interviewQuestions (מיובא בראש הקובץ)
  return answers.map((answer, idx) => ({
    question: questions[idx] || interviewQuestions[idx]?.text || `שאלה ${idx + 1}`,
    answer: answer || '',
  }));
}

export function normalizeCandidates(records = []) {
  if (!Array.isArray(records)) return [];
  return records.map(normalizeCandidate);
}
