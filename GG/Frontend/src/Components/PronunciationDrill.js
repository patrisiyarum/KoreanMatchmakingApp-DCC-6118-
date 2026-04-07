import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { startPronunciationDrill, submitPronunciationDrill } from '../Services/gameLogicService';
import { submitChallengeScore } from '../Services/challengeService';
import Navbar from './NavBar';
import './PronunciationDrill.css';

function PronunciationDrill() {
  const [search] = useSearchParams();
  const id = search.get('id');
  const challengeId = search.get('challengeId');
  const inChallengeMode = !!challengeId;
  const navigate = useNavigate();

  const [phrases, setPhrases] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [practiced, setPracticed] = useState(new Set());
  const [showRomanization, setShowRomanization] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);

  const loadRound = async (diff) => {
    setLoading(true);
    setResult(null);
    setCurrentIdx(0);
    setPracticed(new Set());
    setShowRomanization(false);
    try {
      const data = await startPronunciationDrill(id, diff || difficulty, 5, challengeId);
      setPhrases(data.phrases || []);
    } catch (err) {
      console.error('Failed to start pronunciation drill:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRound(); }, []);

  const markPracticed = () => {
    setPracticed(prev => new Set([...prev, currentIdx]));
    if (currentIdx < phrases.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowRomanization(false);
    }
  };

  const handleSubmit = async () => {
    if (result || submitting) return;
    setSubmitting(true);
    try {
      const data = await submitPronunciationDrill(id, practiced.size + (practiced.has(currentIdx) ? 0 : 1));
      setResult(data);
      if (inChallengeMode) {
        await submitChallengeScore(challengeId, Number(id), data.score);
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

  const phrase = phrases[currentIdx];

  if (loading) return <div className="pd-loading">Loading...</div>;

  return (
    <div className="pd-page">
      <Navbar id={id} />
      <div className="pd-page-content">
      <div className="pd-container">
        <div className="pd-header">
          <h2 className="pd-title">Pronunciation Drill</h2>
          <select value={difficulty} onChange={handleDifficultyChange} className="pd-difficulty">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {!result && phrase && (
          <div className="pd-drill-card">
            <div className="pd-progress-text">
              Phrase {currentIdx + 1} of {phrases.length}
            </div>
            <div className="pd-progress-bar">
              <div className="pd-progress-fill" style={{ width: `${(practiced.size / phrases.length) * 100}%` }} />
            </div>

            <div className="pd-phrase-korean">{phrase.korean}</div>
            <div className="pd-phrase-english">{phrase.english}</div>

            {showRomanization ? (
              <div className="pd-romanization">{phrase.romanization}</div>
            ) : (
              <button className="pd-hint-btn" onClick={() => setShowRomanization(true)}>
                Show Romanization
              </button>
            )}

            <p className="pd-instruction">
              Practice saying this phrase out loud, then mark it as practiced.
            </p>

            <div className="pd-actions">
              <button
                className="pd-prev-btn"
                disabled={currentIdx === 0}
                onClick={() => { setCurrentIdx(c => c - 1); setShowRomanization(false); }}
              >
                Previous
              </button>

              {currentIdx < phrases.length - 1 ? (
                <button className="pd-practice-btn" onClick={markPracticed}>
                  {practiced.has(currentIdx) ? 'Next' : 'Mark Practiced & Next'}
                </button>
              ) : (
                <button
                  className="pd-submit-btn"
                  onClick={() => { markPracticed(); handleSubmit(); }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Finish Drill'}
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="pd-results">
            <div className="pd-mascot">
              <div className="pd-mascot-circle">
                <span className="pd-mascot-face">{result.score >= 80 ? ':D' : result.score >= 50 ? ':)' : ':/'}</span>
              </div>
              <h3 className="pd-congrats">
                {result.score === 100 ? 'Perfect!' : result.score >= 80 ? 'Great job!' : result.score >= 50 ? 'Nice work!' : 'Keep going!'}
              </h3>
              <p className="pd-congrats-sub">
                {result.score >= 80
                  ? 'Your pronunciation is really improving!'
                  : 'Every practice session makes you better!'}
              </p>
            </div>

            <div className="pd-score-banner">
              <span className="pd-score">{result.score}%</span>
              <span className="pd-score-detail">{result.completed}/{result.total} phrases practiced</span>
            </div>

            <div className="pd-xp-bar-section">
              <div className="pd-xp-earned-label">+{result.xpEarned} XP earned</div>
              <div className="pd-xp-track">
                <div className="pd-xp-fill" style={{ width: `${Math.min(100, (result.xpEarned / 50) * 100)}%` }} />
              </div>
            </div>

            {result.newBadges && result.newBadges.length > 0 && (
              <div className="pd-new-badges">
                <h4>New Badges Earned!</h4>
                {result.newBadges.map(b => (
                  <div key={b.id} className="pd-badge-toast">
                    {b.name}
                  </div>
                ))}
              </div>
            )}

            {inChallengeMode && challengeSubmitted && (
              <div className="pd-challenge-notice">
                Score submitted! Waiting for your opponent to finish their turn.
              </div>
            )}

            <div className="pd-all-phrases">
              <h4>Phrases Practiced</h4>
              {phrases.map((p, i) => (
                <div key={i} className="pd-phrase-row">
                  <span className="pd-phrase-kr">{p.korean}</span>
                  <span className="pd-phrase-rom">{p.romanization}</span>
                  <span className="pd-phrase-en">{p.english}</span>
                </div>
              ))}
            </div>

            <div className="pd-actions" style={{ marginTop: '20px' }}>
              <button className="pd-submit-btn" onClick={() => loadRound()}>Practice Again</button>
              <button
                className="pd-back-btn"
                onClick={() => navigate(inChallengeMode ? `/Challenges?id=${id}` : `/GameSelection?id=${id}`)}
              >
                {inChallengeMode ? 'Back to Challenges' : 'Back to Games'}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default PronunciationDrill;
