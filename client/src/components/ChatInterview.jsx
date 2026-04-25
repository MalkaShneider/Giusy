import { useEffect, useRef } from 'react';
import { interviewQuestions } from '../config/interviewQuestions';
import { useSpeechRecorder } from '../hooks/useSpeechRecorder';
import useInterview from '../hooks/useInterview';


export default function ChatInterview({ onConversationEnd, candidateInfo }) {
  const bottomRef = useRef(null);

  const {
    isRecording,
    transcript,
    interim,
    supported,
    error: recError,
    start,
    stop,
    reset,
  } = useSpeechRecorder('he-IL');

  const {
    messages,
    answers,
    input,
    setInput,
    currentIndex,
    done,
    submitting,
    submitError,
    handleSend,
    handleSubmit,
  } = useInterview({ candidateInfo, onConversationEnd, reset });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interim]);

  useEffect(() => {
    if (isRecording) {
      setInput(`${transcript}${interim ? ` ${interim}` : ''}`.trim());
    }
  }, [transcript, interim, isRecording]);

  function handleRecordClick() {
    if (isRecording) {
      stop((finalTranscript) => {
        setInput(finalTranscript);
      });
      return;
    }

    setInput('');
    start();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const isInputDisabled = done || isRecording || submitting;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerAvatar}>מיטל</div>
          <div>
            <div style={styles.headerName}>מיטל - מראיינת </div>
            <div style={styles.headerSub}>ראיון אוטומטי למועמד</div>
          </div>
        </div>

        <div style={styles.headerRight}>
          {isRecording ? (
            <div style={styles.recIndicator}>
              <span style={styles.recDot} />
              מקליט...
            </div>
          ) : null}

          <div
            style={{
              ...styles.progressChip,
              background: done ? '#d1fae5' : '#f8f9fc',
              color: done ? '#059669' : '#1e285a',
              border: done ? '1px solid #6ee7b7' : '1px solid #e2e6ef',
            }}
          >
            {done ? 'הסתיים' : `${Math.min(currentIndex + 1, interviewQuestions.length)} / ${interviewQuestions.length}`}
          </div>
        </div>
      </div>

      <div style={styles.feed}>
        {messages.map((msg, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-start' : 'flex-end' }}>
            {msg.from === 'bot' ? <div style={styles.botAvatar}>מיטל</div> : null}
            <div style={msg.from === 'bot' ? styles.botBubble : styles.userBubble}>{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {submitting ? (
        <div style={styles.submittingBar}>שומר את הראיון... אנא המתן</div>
      ) : null}
      {!supported ? (
        <div style={styles.warning}>זיהוי דיבור אינו נתמך בדפדפן זה. מומלץ Chrome או Edge.</div>
      ) : null}
      {recError ? <div style={styles.warning}>{recError}</div> : null}
      {submitError ? <div style={styles.error}>{submitError}</div> : null}

      <div style={styles.inputRow}>
        <div
          style={{
            ...styles.textareaWrap,
            border: isRecording ? '2px solid #ff375c' : '2px solid #e2e6ef',
            boxShadow: isRecording ? '0 0 0 3px rgba(255,55,92,0.12)' : 'none',
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={done ? 'הראיון הסתיים.' : isRecording ? 'מאזין...' : 'הקלד/י תשובה...'}
            disabled={isInputDisabled}
            style={{ ...styles.textarea, color: isRecording ? '#ff375c' : '#1a1a2e' }}
          />

          {supported ? (
            <button
              onClick={handleRecordClick}
              disabled={done || submitting}
              title={isRecording ? 'עצור הקלטה' : 'התחל הקלטה'}
              style={{
                ...styles.recBtn,
                boxShadow: isRecording ? '0 0 0 3px #ff375c, 0 0 0 6px rgba(255,55,92,0.15)' : '0 0 0 2px #e2e6ef',
                animation: isRecording ? 'recPulse 1.2s ease-in-out infinite' : 'none',
              }}
            >
              {isRecording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff375c">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e285a">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '700px',
    height: '700px',
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #e2e6ef',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(30,40,90,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.75rem',
    borderBottom: '1px solid #e2e6ef',
    background: 'linear-gradient(to right, #f8f9fc, #fff)',
    flexShrink: 0,
    position: 'relative',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  headerAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e285a, #2d3a6e)',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 3px #ff375c, 0 0 0 6px rgba(255,55,92,0.1)',
    flexShrink: 0,
  },
  headerName: { fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', lineHeight: 1.3 },
  headerSub: { fontSize: '0.8rem', color: '#5a6178', marginTop: '2px' },
  progressChip: {
    padding: '0.3rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    transition: 'background 0.2s, color 0.2s',
  },
  recIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#ff375c',
    background: 'rgba(255,55,92,0.08)',
    padding: '0.25rem 0.6rem',
    borderRadius: '9999px',
    border: '1px solid rgba(255,55,92,0.2)',
  },
  recDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#ff375c',
    display: 'inline-block',
    animation: 'recPulse 1s ease-in-out infinite',
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.75rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.125rem',
    background: '#f8f9fc',
  },
  botAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e285a, #2d3a6e)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    alignSelf: 'flex-end',
    marginLeft: '0.75rem',
    marginBottom: '3px',
  },
  botBubble: {
    maxWidth: '85%',
    background: '#fff',
    border: '1px solid #e2e6ef',
    color: '#1a1a2e',
    padding: '0.875rem 1.25rem',
    borderRadius: '16px 0 16px 16px',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    fontWeight: 500,
    boxShadow: '0 2px 6px rgba(30,40,90,0.04)',
  },
  userBubble: {
    maxWidth: '85%',
    background: 'linear-gradient(135deg, #ff375c, #ff5a7a)',
    color: '#fff',
    padding: '0.875rem 1.25rem',
    borderRadius: '16px 16px 16px 0',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(255,55,92,0.2)',
  },
  submittingBar: {
    background: 'linear-gradient(135deg, #1e285a, #2d3a6e)',
    color: '#fff',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    textAlign: 'center',
    fontWeight: 600,
  },
  warning: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  inputRow: {
    display: 'flex',
    gap: '0.8rem',
    padding: '1.25rem 1.5rem',
    borderTop: '1px solid #e2e6ef',
    background: '#fff',
    alignItems: 'flex-end',
  },
  textareaWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '12px',
    background: '#fff',
    border: '2px solid #e2e6ef',
    transition: 'border 0.2s, box-shadow 0.2s',
    overflow: 'hidden',
  },
  textarea: {
    flex: 1,
    padding: '0.75rem 3.5rem 0.75rem 1rem',
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    resize: 'none',
    fontFamily: 'inherit',
    background: 'transparent',
    lineHeight: 1.6,
    color: '#1a1a2e',
    height: '60px',
    overflowY: 'auto',
  },
  recBtn: {
    position: 'absolute',
    left: '0.65rem',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'box-shadow 0.15s',
    padding: 0,
  },
};
