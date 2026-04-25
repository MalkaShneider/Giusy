import { useEffect, useState } from 'react';
import { interviewIntro, interviewQuestions } from '../config/interviewQuestions';
import { submitInterviewAnalysis } from '../services/api';

const DONE_MESSAGE = 'תודה רבה 🙏 הראיון נשמר בהצלחה ונחזור אליך בהקדם.';

export default function useInterview({ candidateInfo, onConversationEnd, reset }) {
  const [messages, setMessages] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setMessages([{ from: 'bot', text: interviewIntro }, { from: 'bot', text: interviewQuestions[0].text }]);
  }, []);

  function pushBot(text) {
    setMessages((prev) => [...prev, { from: 'bot', text }]);
  }

async function handleSubmit(finalAnswers) {
  // 1. חילוץ ה-ID של המועמד - נבדוק את כל האפשרויות
  const candidateId = 
    candidateInfo?._id ||    
    candidateInfo?.id;

  if (!candidateId) {
    setSubmitError('לא נמצא מזהה מועמד. אנא נסה להירשם מחדש.');
    return;
  }

  setSubmitting(true);
  setSubmitError('');
  
  try {
    // הופכים את מערך האובייקטים למערך של מחרוזות (Strings) בלבד
    const plainAnswersForServer = finalAnswers.map(item => 
      typeof item === 'string' ? item : item.answer
    );

    // שליחה לשרת
    const result = await submitInterviewAnalysis(candidateId, plainAnswersForServer);
    
    // הצלחה - מציג הודעה
    pushBot(DONE_MESSAGE);
    
    // מסמנים שהראיון הסתיים
    setDone(true);
    
    // מעביר את התוצאה לדף ה-Completion עם כל הנתונים
    onConversationEnd?.({ 
      ...candidateInfo, 
      _id: candidateId, 
      id: candidateId,
      analysis: result 
    });

  } catch (error) {
    setSubmitError(error.message || 'לא הצלחנו לשמור את תשובות הראיון.');
  } finally {
    setSubmitting(false);
  }
}

  function submitAnswer(text) {
    const trimmed = text.trim();
    if (!trimmed || done || submitting) return;

    const activeQuestion = interviewQuestions[currentIndex];
    const newAnswers = [
      ...answers,
      { questionId: activeQuestion.id, question: activeQuestion.text, answer: trimmed },
    ];

    setMessages((prev) => [...prev, { from: 'user', text: trimmed }]);
    setAnswers(newAnswers);
    setInput('');
    reset();

    const nextIndex = currentIndex + 1;
    if (nextIndex < interviewQuestions.length) {
      setCurrentIndex(nextIndex);
      setTimeout(() => pushBot(interviewQuestions[nextIndex].text), 350);
      return;
    }

    // סיום הראיון - שולחים לשרת
    handleSubmit(newAnswers);
  }

  function handleSend() {
    if (!input.trim() || done || submitting) return;
    submitAnswer(input);
  }

  return {
    messages,
    answers,
    input,
    setInput,
    currentIndex,
    done,
    submitting,
    submitError,
    handleSend,
    submitAnswer,
  };
}
