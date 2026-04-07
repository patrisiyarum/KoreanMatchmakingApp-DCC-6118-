import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { startGrammarQuiz, submitGrammarQuiz } from '../Services/gameLogicService';
import { submitChallengeScore } from '../Services/challengeService';
import Navbar from './NavBar';
import './GrammarQuiz.css';

function GrammarQuiz() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const challengeId = search.get('challengeId');
  const urlDifficulty = search.get('difficulty');
  const inChallengeMode = !!challengeId;
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState(urlDifficulty || 'Beginner');
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);

  const loadRound = async (diff) => {
    setLoading(true);
    setResult(null);
    setCurrentQ(0);
    setAnswers([]);
    setChallengeSubmitted(false);
    try {
      const data = await startGrammarQuiz(id, diff || difficulty, 5, challengeId);
      setQuestions(data.questions || []);
      setAnswers(new Array((data.questions || []).length).fill(null));
    } catch (err) {
      console.error('Failed to start grammar quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRound(); }, []);

  const selectAnswer = (optionIndex) => {
    if (result) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const isCorrect = (q, answerIdx) => {
    if (answerIdx === null || q?.correctIndex === undefined) return null;
    return answerIdx === q.correctIndex;
  };

  const handleSubmit = async () => {
    if (result || submitting) return;
    setSubmitting(true);
    try {
      const data = await submitGrammarQuiz(id, answers);
      setResult(data);
      if (inChallengeMode) {
        await submitChallengeScore(challengeId, id, data.score);
        setChallengeSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    loadRound(e.target.value);
  };

  const allAnswered = answers.every(a => a !== null);
  const q = questions[currentQ];

  if (loading) return <div className="gq-loading">Loading...</div>;

  return (
    <div className="gq-page">
      <Navbar id={id} />
      <div className="gq-page-content">
      <div className="gq-container">
        <div className="gq-header">
          <h2 className="gq-title">Grammar Quiz{inChallengeMode ? ' — Challenge' : ''}</h2>
          {inChallengeMode ? (
            <span className="gq-difficulty-locked">{difficulty}</span>
          ) : (
            <select value={difficulty} onChange={handleDifficultyChange} className="gq-difficulty">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          )}
        </div>

        {!result && q && (
          <div className="gq-question-card">
            <div className="gq-progress-text">
              Question {currentQ + 1} of {questions.length}
            </div>
            <div className="gq-progress-bar">
              <div className="gq-progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>
            <p className="gq-question-text">{q.question}</p>
            <div className="gq-options">
              {q.options.map((opt, idx) => {
                const selected = answers[currentQ] === idx;
                const correct = isCorrect(q, answers[currentQ]);
                const showAsCorrect = correct === false && q.correctIndex === idx;
                return (
                  <button
                    key={idx}
                    className={`gq-option ${selected ? 'gq-selected' : ''} ${
                      selected && correct === true ? 'gq-correct' : ''
                    } ${selected && correct === false ? 'gq-wrong' : ''} ${
                      showAsCorrect ? 'gq-show-correct' : ''
                    }`}
                    onClick={() => selectAnswer(idx)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {answers[currentQ] !== null && isCorrect(q, answers[currentQ]) === false && q.explanation && (
              <div className="gq-instant-feedback">
                <p className="gq-feedback-label">Correct answer: {q.options[q.correctIndex]}</p>
                <p className="gq-feedback-explanation">{q.explanation}</p>
              </div>
            )}
            <div className="gq-nav">
              <button
                className="gq-nav-btn"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(c => c - 1)}
              >
                Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  className="gq-nav-btn gq-nav-next"
                  onClick={() => setCurrentQ(c => c + 1)}
                  disabled={answers[currentQ] === null}
                >
                  Next
                </button>
              ) : (
                <button
                  className="gq-submit-btn"
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? 'Checking...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="gq-results">
            <div className="gq-mascot">
              <div className="gq-mascot-circle">
                <span className="gq-mascot-face">{result.score >= 80 ? ':D' : result.score >= 50 ? ':)' : ':/'}</span>
              </div>
              <h3 className="gq-congrats">
                {result.score === 100 ? 'Perfect!' : result.score >= 80 ? 'Great job!' : result.score >= 50 ? 'Nice work!' : 'Keep going!'}
              </h3>
              <p className="gq-congrats-sub">
                {result.score >= 80 ? 'Your grammar skills are shining!' : 'Practice makes perfect!'}
              </p>
            </div>

            <div className="gq-score-banner">
              <span className="gq-score">{result.score}%</span>
              <span className="gq-score-detail">{result.correct}/{result.total} correct</span>
            </div>
            <div className="gq-xp-bar-section">
              <div className="gq-xp-earned-label">+{result.xpEarned} XP earned</div>
              <div className="gq-xp-track"><div className="gq-xp-fill" style={{ width: `${Math.min(100, (result.xpEarned / 50) * 100)}%` }} /></div>
            </div>

            {inChallengeMode && challengeSubmitted && (
              <div className="gq-challenge-notice">
                Score submitted! Waiting for your opponent to finish their turn.
              </div>
            )}

            {result.newBadges && result.newBadges.length > 0 && (
              <div className="gq-new-badges">
                <h4>New Badges Earned!</h4>
                {result.newBadges.map(b => (
                  <div key={b.id} className="gq-badge-toast">
                    {b.name}
                  </div>
                ))}
              </div>
            )}

            {result.results && (
              <div className="gq-review">
                <h4>Review</h4>
                {result.results.map((r, i) => (
                  <div key={r.id} className={`gq-review-item ${r.correct ? 'gq-correct' : 'gq-wrong'}`}>
                    <div className="gq-review-q">Q{i + 1}: {questions[i]?.question}</div>
                    <div className="gq-review-answer">
                      Your answer: {questions[i]?.options[answers[i]]}
                      {!r.correct && (
                        <span className="gq-review-correct"> (Correct: {questions[i]?.options[r.correctAnswer]})</span>
                      )}
                    </div>
                    <div className="gq-explanation">{r.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="gq-actions">
              {inChallengeMode ? (
                <button className="gq-back-btn" onClick={() => navigate(`/Challenges?id=${id}`)}>
                  Back to Challenges
                </button>
              ) : (
                <>
                  <button className="gq-submit-btn" onClick={() => loadRound()}>Play Again</button>
                  <button className="gq-back-btn" onClick={() => navigate(`/GameSelection?id=${id}`)}>
                    Back to Games
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default GrammarQuiz;
